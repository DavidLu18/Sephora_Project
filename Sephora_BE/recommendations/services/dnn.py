from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, List

import torch
from torch import nn

from .feature_encoder import DNNFeatureEncoder


class ResidualBlock(nn.Module):
    def __init__(self, dim: int, hidden_dim: int, dropout: float) -> None:
        super().__init__()
        self.fc1 = nn.Linear(dim, hidden_dim)
        self.act = nn.GELU()
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(hidden_dim, dim)
        self.norm = nn.LayerNorm(dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.fc1(x)
        out = self.act(out)
        out = self.dropout(out)
        out = self.fc2(out)
        out = self.dropout(out)
        out = out + residual
        out = self.norm(out)
        return out


class SephoraDNN(nn.Module):
    def __init__(
        self,
        categorical_features,
        embedding_sizes,
        numeric_dim: int,
        highlight_dim: int,
    ) -> None:
        super().__init__()
        self.categorical_features = list(categorical_features)

        self.embeddings = nn.ModuleDict()
        total_embed_dim = 0
        for feature in self.categorical_features:
            num_embeddings, embed_dim = embedding_sizes[feature]
            self.embeddings[feature] = nn.Embedding(
                num_embeddings=num_embeddings,
                embedding_dim=embed_dim,
                padding_idx=0,
            )
            total_embed_dim += embed_dim

        self.embedding_dropout = nn.Dropout(0.15)
        self.numeric_ln = nn.LayerNorm(numeric_dim) if numeric_dim > 0 else None
        input_dim = total_embed_dim + numeric_dim + highlight_dim

        self.input_norm = nn.LayerNorm(input_dim)
        hidden_dim = 256
        self.feature_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
        )

        self.blocks = nn.ModuleList(
            [ResidualBlock(hidden_dim, hidden_dim * 2, dropout=0.3) for _ in range(2)]
        )

        self.head = nn.Sequential(
            nn.LayerNorm(hidden_dim),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(64, 1),
        )

    def forward(self, categorical: torch.Tensor, numeric: torch.Tensor, highlights: torch.Tensor) -> torch.Tensor:
        embed_vectors: List[torch.Tensor] = []
        for idx, feature in enumerate(self.categorical_features):
            emb = self.embeddings[feature](categorical[:, idx])
            embed_vectors.append(emb)
        embedded = torch.cat(embed_vectors, dim=1)
        embedded = self.embedding_dropout(embedded)

        if self.numeric_ln is not None:
            numeric = self.numeric_ln(numeric)

        x = torch.cat([embedded, numeric, highlights], dim=1)
        x = self.input_norm(x)
        x = self.feature_proj(x)
        for block in self.blocks:
            x = block(x)
        logits = self.head(x)
        return logits.squeeze(-1)


class DNNRecommendationService:
    """Lazy loader for the pre-trained DNN model + encoder."""

    def __init__(self, artifacts_dir: Path | str, device: str = "cpu") -> None:
        self.artifacts_dir = Path(artifacts_dir)
        self.device = torch.device(device)
        self._model: SephoraDNN | None = None
        self._encoder: DNNFeatureEncoder | None = None

    def _load(self) -> None:
        if self._model is not None and self._encoder is not None:
            return
        metadata_path = self.artifacts_dir / "dnn_metadata.pt"
        weights_path = self.artifacts_dir / "dnn_best_model.pt"
        metadata = torch.load(metadata_path, map_location="cpu")
        encoder = DNNFeatureEncoder(metadata)
        embedding_sizes = metadata["embedding_sizes"]
        model = SephoraDNN(
            categorical_features=metadata["categorical_features"],
            embedding_sizes=embedding_sizes,
            numeric_dim=len(metadata["numeric_columns"]),
            highlight_dim=len(metadata["highlight_list"]),
        )
        model.load_state_dict(torch.load(weights_path, map_location="cpu"))
        model.eval()
        self._model = model.to(self.device)
        self._encoder = encoder

    def score_records(self, records: Iterable[Dict[str, object]]) -> List[float]:
        self._load()
        assert self._model is not None and self._encoder is not None
        categorical, numeric, highlights = self._encoder.encode_batch(records)
        if categorical.shape[0] == 0:
            return []
        categorical = categorical.to(self.device)
        numeric = numeric.to(self.device)
        highlights = highlights.to(self.device)
        with torch.no_grad():
            logits = self._model(categorical, numeric, highlights)
            scores = torch.sigmoid(logits).cpu().tolist()
        return [float(score) for score in scores]

