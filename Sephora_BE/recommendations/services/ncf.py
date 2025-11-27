from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable, Optional

import torch
from torch import nn


class NeuMF(nn.Module):
    def __init__(self, num_users: int, num_items: int, embedding_dim: int, hidden_dims: Iterable[int], dropout: float) -> None:
        super().__init__()
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        layers = []
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


class NCFRecommendationService:
    """Wrapper around the NeuMF model saved inside Model_AI_Sephora_NCF/artifacts."""

    def __init__(self, artifacts_dir: Path | str, device: str = "cpu") -> None:
        self.artifacts_dir = Path(artifacts_dir)
        self.device = torch.device(device)
        self._model: Optional[NeuMF] = None
        self._user_encoder: Dict[str, int] | None = None
        self._item_encoder: Dict[str, int] | None = None

    def _load(self) -> None:
        if self._model is not None:
            return
        metrics_path = self.artifacts_dir / "ncf_metrics.json"
        model_path = self.artifacts_dir / "ncf_model.pt"
        user_encoder_path = self.artifacts_dir / "user_encoder.json"
        item_encoder_path = self.artifacts_dir / "item_encoder.json"
        if not metrics_path.exists():
            raise FileNotFoundError(f"Missing NCF artifacts in {self.artifacts_dir}")
        config = json.loads(metrics_path.read_text(encoding="utf-8")).get("config", {})
        embedding_dim = config.get("embedding_dim", 64)
        hidden_dims = config.get("hidden_dims", [128, 64])
        dropout = config.get("dropout", 0.2)
        self._user_encoder = json.loads(user_encoder_path.read_text(encoding="utf-8"))
        self._item_encoder = json.loads(item_encoder_path.read_text(encoding="utf-8"))
        model = NeuMF(
            num_users=len(self._user_encoder),
            num_items=len(self._item_encoder),
            embedding_dim=embedding_dim,
            hidden_dims=hidden_dims,
            dropout=dropout,
        )
        state = torch.load(model_path, map_location="cpu")
        model.load_state_dict(state)
        model.eval()
        self._model = model.to(self.device)

    def score(self, user_identifier: str | None, product_external_id: str | None) -> Optional[float]:
        if not user_identifier or not product_external_id:
            return None
        self._load()
        assert self._model is not None and self._user_encoder is not None and self._item_encoder is not None
        user_idx = self._user_encoder.get(str(user_identifier))
        item_idx = self._item_encoder.get(str(product_external_id))
        if user_idx is None or item_idx is None:
            return None
        user_tensor = torch.tensor([user_idx], dtype=torch.long, device=self.device)
        item_tensor = torch.tensor([item_idx], dtype=torch.long, device=self.device)
        with torch.no_grad():
            logits = self._model(user_tensor, item_tensor)
            score = torch.sigmoid(logits).item()
        return float(score)

