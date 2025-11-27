"""PyTorch DNN model for Sephora personalized recommendations."""

from __future__ import annotations

from typing import Dict, Sequence, Tuple

import torch
from torch import nn


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
        categorical_features: Sequence[str],
        embedding_sizes: Dict[str, Tuple[int, int]],
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
        embed_vectors = []
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
