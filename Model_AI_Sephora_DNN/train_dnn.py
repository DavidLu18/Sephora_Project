from __future__ import annotations

import argparse
import json
from copy import deepcopy
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import accuracy_score, average_precision_score, roc_auc_score
from torch import nn
from torch.amp import GradScaler, autocast
from torch.utils.data import DataLoader

from models.dnn import SephoraDNN
from utils.datasets import (
    CATEGORICAL_FEATURES,
    SephoraDataset,
    build_category_mapping,
    compute_numeric_stats,
)


BASE_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = BASE_DIR / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"


def load_highlights() -> List[str]:
    path = PROCESSED_DIR / "highlights_top.json"
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data["top_highlights"]


def embedding_dim(cardinality: int) -> int:
    dim = int(round(1.6 * cardinality ** 0.56))
    return max(4, min(64, dim))


def build_categorical_maps(train_df: pd.DataFrame) -> Dict[str, Dict[str, int]]:
    maps: Dict[str, Dict[str, int]] = {}
    for feature in CATEGORICAL_FEATURES:
        values = train_df[feature].astype(str).tolist()
        maps[feature] = build_category_mapping(values)
    return maps


def precision_at_k(probs: np.ndarray, labels: np.ndarray, k: int = 10) -> float:
    if len(probs) == 0:
        return float("nan")
    k = min(k, len(probs))
    top_indices = np.argpartition(-probs, k - 1)[:k]
    return float(labels[top_indices].mean())


def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    scaler: GradScaler,
    device: torch.device,
    scheduler: Optional[torch.optim.lr_scheduler._LRScheduler] = None,
    grad_clip: Optional[float] = None,
) -> float:
    model.train()
    total_loss = 0.0
    for categorical, numeric, highlights, labels in loader:
        categorical = categorical.to(device)
        numeric = numeric.to(device)
        highlights = highlights.to(device)
        labels = labels.to(device)

        optimizer.zero_grad(set_to_none=True)
        with autocast("cuda", enabled=device.type == "cuda"):
            logits = model(categorical, numeric, highlights)
            loss = criterion(logits, labels)

        scaler.scale(loss).backward()
        if grad_clip is not None:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
        scaler.step(optimizer)
        scaler.update()
        if scheduler is not None:
            scheduler.step()

        total_loss += loss.item() * labels.size(0)

    return total_loss / len(loader.dataset)


def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Dict[str, float]:
    model.eval()
    total_loss = 0.0
    all_probs: List[np.ndarray] = []
    all_labels: List[np.ndarray] = []

    with torch.no_grad():
        for categorical, numeric, highlights, labels in loader:
            categorical = categorical.to(device)
            numeric = numeric.to(device)
            highlights = highlights.to(device)
            labels = labels.to(device)

            with autocast("cuda", enabled=device.type == "cuda"):
                logits = model(categorical, numeric, highlights)
            loss = criterion(logits, labels)
            probs = torch.sigmoid(logits)

            total_loss += loss.item() * labels.size(0)
            all_probs.append(probs.detach().cpu().numpy())
            all_labels.append(labels.detach().cpu().numpy())

    if not all_probs:
        return {"loss": float("nan"), "roc_auc": float("nan"), "pr_auc": float("nan"), "accuracy": float("nan"), "precision_at_10": float("nan")}

    probs = np.concatenate(all_probs)
    labels_np = np.concatenate(all_labels)

    try:
        roc_auc = roc_auc_score(labels_np, probs)
    except ValueError:
        roc_auc = float("nan")

    try:
        pr_auc = average_precision_score(labels_np, probs)
    except ValueError:
        pr_auc = float("nan")

    preds = (probs >= 0.5).astype(int)
    accuracy = accuracy_score(labels_np, preds)
    prec_at_10 = precision_at_k(probs, labels_np, k=10)

    metrics = {
        "loss": total_loss / len(loader.dataset),
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "accuracy": accuracy,
        "precision_at_10": prec_at_10,
    }
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the Sephora DNN model")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=1024)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--max-lr", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--num-workers", type=int, default=2)
    parser.add_argument("--patience", type=int, default=3)
    parser.add_argument("--grad-clip", type=float, default=1.0)
    parser.add_argument("--output-dir", type=str, default=str(ARTIFACTS_DIR))
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_df = pd.read_parquet(PROCESSED_DIR / "dnn_train.parquet")
    val_df = pd.read_parquet(PROCESSED_DIR / "dnn_val.parquet")
    test_df = pd.read_parquet(PROCESSED_DIR / "dnn_test.parquet")

    for frame in (train_df, val_df, test_df):
        for feature in CATEGORICAL_FEATURES:
            frame[feature] = frame[feature].astype(str)

    categorical_maps = build_categorical_maps(train_df)
    highlight_list = load_highlights()

    numeric_columns = [
        "loves_count",
        "catalog_rating",
        "review_rating",
        "price_usd",
        "child_count",
        "limited_edition",
        "new",
        "online_only",
        "out_of_stock",
        "sephora_exclusive",
        "interaction_recency_days",
        "user_total_interactions",
        "user_positive_rate",
        "user_avg_review_rating",
        "product_total_interactions",
        "product_positive_rate",
        "product_avg_review_rating",
        "log_loves_count",
        "log_price_usd",
        "price_to_category_ratio",
    ]

    numeric_stats = compute_numeric_stats(train_df, numeric_columns)

    train_dataset = SephoraDataset(train_df, categorical_maps, numeric_columns, numeric_stats, highlight_list)
    val_dataset = SephoraDataset(val_df, categorical_maps, numeric_columns, numeric_stats, highlight_list)
    test_dataset = SephoraDataset(test_df, categorical_maps, numeric_columns, numeric_stats, highlight_list)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        pin_memory=device.type == "cuda",
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=device.type == "cuda",
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=device.type == "cuda",
    )

    embedding_sizes = {
        feature: (len(mapping), embedding_dim(len(mapping)))
        for feature, mapping in categorical_maps.items()
    }

    model = SephoraDNN(
        categorical_features=CATEGORICAL_FEATURES,
        embedding_sizes=embedding_sizes,
        numeric_dim=len(numeric_columns),
        highlight_dim=len(highlight_list),
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    steps_per_epoch = max(1, len(train_loader))
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer,
        max_lr=args.max_lr,
        epochs=args.epochs,
        steps_per_epoch=steps_per_epoch,
        pct_start=0.1,
        anneal_strategy="cos",
    )

    pos_ratio = float(train_df["is_recommended"].mean())
    pos_weight_value = (1.0 - pos_ratio) / max(pos_ratio, 1e-6)
    pos_weight = torch.tensor(pos_weight_value, device=device, dtype=torch.float32)

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    scaler = GradScaler("cuda", enabled=device.type == "cuda")

    class EarlyStopping:
        def __init__(self, patience: int, min_delta: float = 0.0) -> None:
            self.patience = patience
            self.min_delta = min_delta
            self.best: float = -float("inf")
            self.counter = 0

        def step(self, value: float) -> bool:
            if value > self.best + self.min_delta:
                self.best = value
                self.counter = 0
                return False
            self.counter += 1
            return self.counter > self.patience

    early_stopper = EarlyStopping(patience=args.patience)

    history: List[Dict[str, float]] = []
    best_state = None
    best_val_auc = -float("inf")
    best_epoch = 0

    for epoch in range(1, args.epochs + 1):
        train_loss = train_one_epoch(
            model,
            train_loader,
            criterion,
            optimizer,
            scaler,
            device,
            scheduler=scheduler,
            grad_clip=args.grad_clip,
        )
        val_metrics = evaluate(model, val_loader, criterion, device)

        epoch_summary = {
            "epoch": epoch,
            "train_loss": train_loss,
            "val_loss": val_metrics["loss"],
            "val_roc_auc": val_metrics["roc_auc"],
            "val_pr_auc": val_metrics["pr_auc"],
            "val_accuracy": val_metrics["accuracy"],
            "val_precision_at_10": val_metrics["precision_at_10"],
            "lr": optimizer.param_groups[0]["lr"],
        }
        history.append(epoch_summary)

        print(
            f"Epoch {epoch:02d} | "
            f"train_loss={train_loss:.4f} | "
            f"val_loss={val_metrics['loss']:.4f} | "
            f"val_auc={val_metrics['roc_auc']:.4f} | "
            f"val_pr_auc={val_metrics['pr_auc']:.4f} | "
            f"val_acc={val_metrics['accuracy']:.4f}"
        )

        if val_metrics["roc_auc"] > best_val_auc:
            best_val_auc = val_metrics["roc_auc"]
            best_state = deepcopy(model.state_dict())
            best_epoch = epoch

        if early_stopper.step(val_metrics["roc_auc"]):
            print(f"Early stopping triggered at epoch {epoch}")
            break

    if best_state is None:
        raise RuntimeError("Training did not produce a valid model state")

    model.load_state_dict(best_state)
    test_metrics = evaluate(model, test_loader, criterion, device)
    print(
        "Test metrics | loss={loss:.4f} | roc_auc={roc_auc:.4f} | pr_auc={pr_auc:.4f} | accuracy={accuracy:.4f} | precision@10={precision_at_10:.4f}".format(
            **test_metrics
        )
    )

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), ARTIFACTS_DIR / "dnn_best_model.pt")

    metadata = {
        "categorical_features": list(CATEGORICAL_FEATURES),
        "categorical_maps": categorical_maps,
        "numeric_columns": numeric_columns,
        "numeric_mean": numeric_stats["mean"].tolist(),
        "numeric_std": numeric_stats["std"].tolist(),
        "highlight_list": highlight_list,
        "embedding_sizes": embedding_sizes,
    }
    torch.save(metadata, ARTIFACTS_DIR / "dnn_metadata.pt")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    results = {
        "history": history,
        "best_val_auc": best_val_auc,
        "test_metrics": test_metrics,
        "best_epoch": best_epoch,
        "pos_weight": pos_weight_value,
    }
    with (output_dir / "training_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
