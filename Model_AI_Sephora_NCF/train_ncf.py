"""Training script for a Neural Collaborative Filtering (NCF) model on Sephora data."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Sequence, Tuple, Optional

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from torch import nn
from torch.utils.data import DataLoader, Dataset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train an NCF model using review data.")
    parser.add_argument("--data-dir", type=Path, default=Path("data"), help="Directory containing CSV files.")
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/ncf"), help="Where to store model artifacts.")
    parser.add_argument("--embedding-dim", type=int, default=64, help="Embedding size for users/items.")
    parser.add_argument("--hidden-dims", type=str, default="128,64", help="Comma separated hidden layer sizes.")
    parser.add_argument("--dropout", type=float, default=0.2, help="Dropout applied after hidden layers.")
    parser.add_argument("--batch-size", type=int, default=4096, help="Training batch size.")
    parser.add_argument("--epochs", type=int, default=15, help="Maximum number of training epochs.")
    parser.add_argument("--learning-rate", type=float, default=1e-3, help="Optimizer learning rate.")
    parser.add_argument("--weight-decay", type=float, default=1e-5, help="L2 regularization strength applied to optimizer.")
    parser.add_argument("--num-negatives", type=int, default=4, help="Negative samples per positive interaction (training).")
    parser.add_argument("--eval-negatives", type=int, default=50, help="Negative items per user during evaluation.")
    parser.add_argument("--top-k", type=int, default=10, help="K cutoff for ranking metrics (Hit@K / NDCG@K).")
    parser.add_argument("--patience", type=int, default=5, help="Early stopping patience in epochs (0 disables early stopping).")
    parser.add_argument("--min-delta", type=float, default=1e-4, help="Minimum improvement in validation metric to reset patience.")
    parser.add_argument(
        "--lr-scheduler",
        choices=["none", "plateau", "cosine"],
        default="plateau",
        help="Learning rate scheduler strategy.",
    )
    parser.add_argument("--scheduler-factor", type=float, default=0.5, help="LR reduction factor for plateau scheduler.")
    parser.add_argument("--scheduler-patience", type=int, default=2, help="Patience (epochs) before LR reduction for plateau scheduler.")
    parser.add_argument("--min-lr", type=float, default=1e-6, help="Minimum learning rate allowed by schedulers.")
    parser.add_argument("--num-workers", type=int, default=0, help="Number of worker processes for data loading.")
    parser.add_argument("--positive-rating-threshold", type=float, default=4.0, help="Minimum rating to treat as positive feedback.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument("--device", type=str, default="auto", help="Set to 'cpu', 'cuda', or 'auto'.")
    parser.add_argument(
        "--disable-resample-negatives",
        dest="resample_negatives",
        action="store_false",
        help="Disable epoch-wise negative resampling (keeps negatives fixed).",
    )
    parser.set_defaults(resample_negatives=True)
    return parser.parse_args()


def load_review_frames(data_dir: Path) -> pd.DataFrame:
    csv_paths = sorted(data_dir.glob("reviews_*.csv"))
    if not csv_paths:
        raise FileNotFoundError(f"No review CSV files found in {data_dir}.")
    frames = []
    for path in csv_paths:
        frame = pd.read_csv(path)
        frames.append(frame)
    return pd.concat(frames, ignore_index=True)


def load_products(data_dir: Path) -> pd.DataFrame:
    product_path = data_dir / "product_info.csv"
    if not product_path.exists():
        raise FileNotFoundError(f"Missing product_info.csv in {data_dir}.")
    return pd.read_csv(product_path)


def preprocess_reviews(df: pd.DataFrame, rating_threshold: float) -> pd.DataFrame:
    df = df.copy()
    df = df.dropna(subset=["author_id", "product_id"])
    df["author_id"] = df["author_id"].astype(str)
    df["product_id"] = df["product_id"].astype(str)
    df["rating"] = df["rating"].fillna(0)
    df["is_recommended"] = df["is_recommended"].fillna(0)
    df["submission_time"] = pd.to_datetime(df["submission_time"], errors="coerce")
    df["submission_time"] = df["submission_time"].fillna(pd.Timestamp("1970-01-01"))
    df = df[df["rating"].notna() | df["is_recommended"].notna()]
    df["label"] = ((df["rating"] >= rating_threshold) | (df["is_recommended"] == 1.0)).astype(int)
    df = df[df["label"] == 1]
    df = df.drop_duplicates(subset=["author_id", "product_id"], keep="last")
    return df.reset_index(drop=True)


def encode_entities(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int], Dict[str, int]]:
    user_ids = sorted(df["author_id"].unique())
    item_ids = sorted(df["product_id"].unique())
    user_encoder = {uid: idx for idx, uid in enumerate(user_ids)}
    item_encoder = {pid: idx for idx, pid in enumerate(item_ids)}
    df = df.assign(
        user_idx=df["author_id"].map(user_encoder),
        item_idx=df["product_id"].map(item_encoder),
    )
    return df, user_encoder, item_encoder


def temporal_user_split(df: pd.DataFrame, seed: int) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train_rows: List[pd.DataFrame] = []
    val_rows: List[pd.DataFrame] = []
    test_rows: List[pd.DataFrame] = []
    grouped = df.sort_values("submission_time").groupby("user_idx", sort=False)
    for _, group in grouped:
        group = group.sort_values("submission_time")
        if len(group) >= 3:
            test_rows.append(group.iloc[[-1]])
            val_rows.append(group.iloc[[-2]])
            train_rows.append(group.iloc[:-2])
        elif len(group) == 2:
            test_rows.append(group.iloc[[-1]])
            train_rows.append(group.iloc[[-2]])
        else:
            train_rows.append(group)
    train_df = pd.concat(train_rows, ignore_index=True) if train_rows else pd.DataFrame(columns=df.columns)
    val_df = pd.concat(val_rows, ignore_index=True) if val_rows else pd.DataFrame(columns=df.columns)
    test_df = pd.concat(test_rows, ignore_index=True) if test_rows else pd.DataFrame(columns=df.columns)
    if val_df.empty or test_df.empty:
        remaining_train, test_df = train_test_split(
            df,
            test_size=0.1,
            random_state=seed,
            shuffle=True,
        )
        train_df, val_df = train_test_split(
            remaining_train,
            test_size=0.111,
            random_state=seed,
            shuffle=True,
        )
    return train_df.reset_index(drop=True), val_df.reset_index(drop=True), test_df.reset_index(drop=True)


def build_user_positive_map(df: pd.DataFrame) -> Dict[int, set[int]]:
    user_pos: Dict[int, set[int]] = {}
    for row in df.itertuples(index=False):
        user_pos.setdefault(row.user_idx, set()).add(row.item_idx)
    return user_pos


class NeuMF(nn.Module):
    def __init__(self, num_users: int, num_items: int, embedding_dim: int, hidden_dims: Sequence[int], dropout: float) -> None:
        super().__init__()
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        layers: List[nn.Module] = []
        in_features = embedding_dim * 2
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(in_features, hidden_dim))
            layers.append(nn.ReLU())
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            in_features = hidden_dim
        layers.append(nn.Linear(in_features, 1))
        self.mlp = nn.Sequential(*layers)
        self._init_weights()

    def _init_weights(self) -> None:
        nn.init.xavier_uniform_(self.user_embedding.weight)
        nn.init.xavier_uniform_(self.item_embedding.weight)
        for module in self.mlp:
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)

    def forward(self, user_indices: torch.Tensor, item_indices: torch.Tensor) -> torch.Tensor:
        user_vec = self.user_embedding(user_indices)
        item_vec = self.item_embedding(item_indices)
        features = torch.cat([user_vec, item_vec], dim=-1)
        logits = self.mlp(features)
        return logits.squeeze(-1)


class NCFDataset(Dataset):
    def __init__(
        self,
        positives: Sequence[Tuple[int, int]],
        num_items: int,
        user_positive: Dict[int, set[int]],
        num_negatives: int,
        seed: int,
    ) -> None:
        self.positives = list(positives)
        self.num_items = num_items
        self.user_positive = user_positive
        self.num_negatives = max(1, num_negatives)
        self.rng = np.random.default_rng(seed)
        self.pos_len = len(self.positives)
        if self.pos_len == 0:
            raise ValueError("Training set is empty; cannot build dataset.")

    def __len__(self) -> int:
        return self.pos_len * (1 + self.num_negatives)

    def __getitem__(self, idx: int) -> Tuple[int, int, float]:
        if idx < self.pos_len:
            user, item = self.positives[idx]
            return user, item, 1.0
        base_idx = (idx - self.pos_len) % self.pos_len
        user, _ = self.positives[base_idx]
        item = self._sample_negative(user)
        return user, item, 0.0

    def _sample_negative(self, user: int) -> int:
        positive_items = self.user_positive[user]
        while True:
            candidate = int(self.rng.integers(0, self.num_items))
            if candidate not in positive_items:
                return candidate


def collate_interactions(batch: Sequence[Tuple[int, int, float]]) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    users = torch.tensor([row[0] for row in batch], dtype=torch.long)
    items = torch.tensor([row[1] for row in batch], dtype=torch.long)
    labels = torch.tensor([row[2] for row in batch], dtype=torch.float32)
    return users, items, labels


def train_one_epoch(
    model: NeuMF,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> float:
    model.train()
    running_loss = 0.0
    total_samples = 0
    for user_idx, item_idx, labels in loader:
        user_idx = user_idx.to(device)
        item_idx = item_idx.to(device)
        labels = labels.to(device)
        optimizer.zero_grad()
        logits = model(user_idx, item_idx)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()
        batch_size = labels.size(0)
        running_loss += loss.item() * batch_size
        total_samples += batch_size
    return running_loss / max(1, total_samples)


def evaluate_model(
    model: NeuMF,
    pairs: Sequence[Tuple[int, int]],
    user_positive: Dict[int, set[int]],
    num_items: int,
    device: torch.device,
    num_negatives: int,
    k: int,
    seed: int,
) -> Dict[str, float]:
    if not pairs:
        return {"hit@k": float("nan"), "ndcg@k": float("nan"), "roc_auc": float("nan")}
    rng = np.random.default_rng(seed)
    hits: List[float] = []
    ndcgs: List[float] = []
    all_labels: List[int] = []
    all_scores: List[float] = []
    model.eval()
    with torch.no_grad():
        for user, pos_item in pairs:
            candidate_items = [pos_item]
            neg_items: set[int] = set()
            while len(neg_items) < num_negatives:
                candidate = int(rng.integers(0, num_items))
                if candidate not in user_positive[user]:
                    neg_items.add(candidate)
            candidate_items.extend(neg_items)
            user_tensor = torch.full((len(candidate_items),), user, dtype=torch.long, device=device)
            item_tensor = torch.tensor(candidate_items, dtype=torch.long, device=device)
            logits = model(user_tensor, item_tensor)
            scores = torch.sigmoid(logits).cpu().numpy()
            all_labels.extend([1] + [0] * num_negatives)
            all_scores.extend(scores.tolist())
            order = np.argsort(scores)[::-1]
            positive_rank = int(np.where(order == 0)[0][0])
            hits.append(1.0 if positive_rank < k else 0.0)
            ndcgs.append(1.0 / np.log2(positive_rank + 2))
    roc_auc = roc_auc_score(all_labels, all_scores) if len(set(all_labels)) > 1 else float("nan")
    return {
        f"hit@{k}": float(np.mean(hits)),
        f"ndcg@{k}": float(np.mean(ndcgs)),
        "roc_auc": float(roc_auc),
    }


def prepare_dataloader(
    train_interactions: Sequence[Tuple[int, int]],
    num_items: int,
    user_positive: Dict[int, set[int]],
    *,
    batch_size: int,
    num_negatives: int,
    seed: int,
    num_workers: int,
) -> DataLoader:
    dataset = NCFDataset(
        positives=train_interactions,
        num_items=num_items,
        user_positive=user_positive,
        num_negatives=num_negatives,
        seed=seed,
    )

    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        drop_last=False,
        num_workers=num_workers,
        collate_fn=collate_interactions,
    )


def determine_device(device_arg: str) -> torch.device:
    if device_arg == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(device_arg)


def build_scheduler(optimizer: torch.optim.Optimizer, args: argparse.Namespace) -> Optional[torch.optim.lr_scheduler._LRScheduler]:
    if args.lr_scheduler == "plateau":
        return torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode="max",
            factor=args.scheduler_factor,
            patience=args.scheduler_patience,
            min_lr=args.min_lr,
        )
    if args.lr_scheduler == "cosine":
        return torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=max(1, args.epochs),
            eta_min=args.min_lr,
        )
    return None


def main() -> None:
    args = parse_args()
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    data_dir = args.data_dir.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading data from {data_dir} ...")
    reviews = load_review_frames(data_dir)
    products = load_products(data_dir)
    print(f"Loaded {len(reviews):,} raw reviews and {len(products):,} products.")

    reviews = preprocess_reviews(reviews, args.positive_rating_threshold)
    reviews, user_encoder, item_encoder = encode_entities(reviews)
    print(
        f"Filtered down to {len(reviews):,} positive interactions across "
        f"{len(user_encoder):,} users and {len(item_encoder):,} products."
    )

    train_df, val_df, test_df = temporal_user_split(reviews, args.seed)
    print(
        "Split interactions -> "
        f"train: {len(train_df):,}, val: {len(val_df):,}, test: {len(test_df):,}"
    )

    user_positive = build_user_positive_map(reviews)
    train_interactions = list(zip(train_df["user_idx"], train_df["item_idx"]))
    val_pairs = list(zip(val_df["user_idx"], val_df["item_idx"]))
    test_pairs = list(zip(test_df["user_idx"], test_df["item_idx"]))

    device = determine_device(args.device)
    print(f"Using device: {device}")

    hidden_dims = tuple(int(dim.strip()) for dim in args.hidden_dims.split(",") if dim.strip())
    model = NeuMF(
        num_users=len(user_encoder),
        num_items=len(item_encoder),
        embedding_dim=args.embedding_dim,
        hidden_dims=hidden_dims,
        dropout=args.dropout,
    ).to(device)

    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)

    def make_train_loader(seed_offset: int) -> DataLoader:
        return prepare_dataloader(
            train_interactions,
            len(item_encoder),
            user_positive,
            batch_size=args.batch_size,
            num_negatives=args.num_negatives,
            seed=args.seed + seed_offset,
            num_workers=args.num_workers,
        )

    train_loader = make_train_loader(0)
    scheduler = build_scheduler(optimizer, args)

    best_val_hit = -np.inf
    best_state = None
    best_epoch = 0
    epochs_without_improvement = 0
    metrics_history: List[Dict[str, float]] = []
    metric_key = f"hit@{args.top_k}"

    for epoch in range(1, args.epochs + 1):
        if args.resample_negatives and epoch > 1:
            train_loader = make_train_loader(epoch)

        loss = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_metrics = evaluate_model(
            model,
            val_pairs,
            user_positive,
            len(item_encoder),
            device,
            num_negatives=args.eval_negatives,
            k=args.top_k,
            seed=args.seed + epoch,
        )
        current_lr = optimizer.param_groups[0]["lr"]
        metrics_history.append({"epoch": epoch, "loss": loss, "lr": current_lr, **val_metrics})
        print(
            f"Epoch {epoch}/{args.epochs} - loss: {loss:.4f} "
            f"val_hit@{args.top_k}: {val_metrics[metric_key]:.4f} "
            f"val_ndcg@{args.top_k}: {val_metrics[f'ndcg@{args.top_k}']:.4f}"
        )

        if scheduler is not None:
            if isinstance(scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                scheduler.step(val_metrics[metric_key])
            else:
                scheduler.step()

        if val_metrics[metric_key] > best_val_hit + args.min_delta:
            best_val_hit = val_metrics[metric_key]
            best_state = {
                "model": model.state_dict(),
                "val_metrics": val_metrics,
                "epoch": epoch,
            }
            best_epoch = epoch
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1
            if args.patience > 0 and epochs_without_improvement >= args.patience:
                print(f"Early stopping triggered at epoch {epoch} (no improvement for {args.patience} epochs).")
                break

    if best_state is not None:
        model.load_state_dict(best_state["model"])

    test_metrics = evaluate_model(
        model,
        test_pairs,
        user_positive,
        len(item_encoder),
        device,
        num_negatives=args.eval_negatives,
        k=args.top_k,
        seed=args.seed + 999,
    )
    print(
        "Test metrics -> "
        f"hit@{args.top_k}: {test_metrics[f'hit@{args.top_k}']:.4f} "
        f"ndcg@{args.top_k}: {test_metrics[f'ndcg@{args.top_k}']:.4f} roc_auc: {test_metrics['roc_auc']:.4f}"
    )

    artifact_payload = {
        "config": {
            "embedding_dim": args.embedding_dim,
            "hidden_dims": hidden_dims,
            "dropout": args.dropout,
            "batch_size": args.batch_size,
            "epochs": args.epochs,
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "num_negatives": args.num_negatives,
            "eval_negatives": args.eval_negatives,
            "top_k": args.top_k,
            "positive_rating_threshold": args.positive_rating_threshold,
            "seed": args.seed,
            "device": str(device),
            "patience": args.patience,
            "min_delta": args.min_delta,
            "lr_scheduler": args.lr_scheduler,
            "scheduler_factor": args.scheduler_factor,
            "scheduler_patience": args.scheduler_patience,
            "min_lr": args.min_lr,
            "num_workers": args.num_workers,
            "resample_negatives": args.resample_negatives,
        },
        "val_metrics": best_state["val_metrics"] if best_state else {},
        "test_metrics": test_metrics,
        "history": metrics_history,
        "num_users": len(user_encoder),
        "num_items": len(item_encoder),
        "train_samples": len(train_interactions),
        "best_epoch": best_epoch,
    }

    if metrics_history:
        history_df = pd.DataFrame(metrics_history)
        history_df.to_csv(output_dir / "ncf_training_history.csv", index=False)

    torch.save(model.state_dict(), output_dir / "ncf_model.pt")
    with open(output_dir / "ncf_metrics.json", "w", encoding="utf-8") as fp:
        json.dump(artifact_payload, fp, indent=2)
    with open(output_dir / "user_encoder.json", "w", encoding="utf-8") as fp:
        json.dump(user_encoder, fp)
    with open(output_dir / "item_encoder.json", "w", encoding="utf-8") as fp:
        json.dump(item_encoder, fp)

    print(f"Artifacts stored in {output_dir}")


if __name__ == "__main__":
    main()
