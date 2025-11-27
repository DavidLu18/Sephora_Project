"""Dataset utilities for the Sephora personalized recommendation project."""

from __future__ import annotations

import ast
from typing import Dict, Iterable, List, Sequence

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset


# Features that will be embedded by the DNN
CATEGORICAL_FEATURES: Sequence[str] = (
    "author_id",
    "product_id",
    "brand_id",
    "primary_category",
    "secondary_category",
    "tertiary_category",
    "skin_type",
    "skin_tone",
    "eye_color",
    "hair_color",
)


def parse_highlight_cell(cell) -> List[str]:
    if isinstance(cell, list):
        return [str(item) for item in cell]
    if isinstance(cell, str):
        cell = cell.strip()
        if not cell:
            return []
        if cell.startswith("["):
            try:
                parsed = ast.literal_eval(cell)
                if isinstance(parsed, (list, tuple)):
                    return [str(item) for item in parsed]
            except (SyntaxError, ValueError):
                pass
        return [item for item in cell.split("|") if item]
    return []


class SephoraDataset(Dataset):
    """Torch dataset wrapping the model-ready parquet splits."""

    def __init__(
        self,
        frame: pd.DataFrame,
        categorical_maps: Dict[str, Dict[str, int]],
        numeric_columns: Sequence[str],
        numeric_stats: Dict[str, np.ndarray],
        highlight_list: Sequence[str],
    ) -> None:
        self.frame = frame.reset_index(drop=True)
        self.categorical_maps = categorical_maps
        self.numeric_columns = numeric_columns
        self.numeric_means = numeric_stats["mean"].astype(np.float32)
        self.numeric_stds = numeric_stats["std"].astype(np.float32)
        self.highlight_positions = {tag: idx for idx, tag in enumerate(highlight_list)}
        self.highlight_dim = len(highlight_list)

    def __len__(self) -> int:
        return len(self.frame)

    def _encode_categorical(self, row: pd.Series) -> List[int]:
        indices = []
        for feature in CATEGORICAL_FEATURES:
            mapping = self.categorical_maps[feature]
            value = row[feature]
            if value not in mapping:
                value = "<unk>"
            indices.append(mapping[value])
        return indices

    def _encode_highlights(self, value) -> np.ndarray:
        tags = parse_highlight_cell(value)
        vec = np.zeros(self.highlight_dim, dtype=np.float32)
        for tag in tags:
            idx = self.highlight_positions.get(tag)
            if idx is not None:
                vec[idx] = 1.0
        return vec

    def __getitem__(self, idx: int):
        row = self.frame.iloc[idx]
        cat_indices = torch.tensor(self._encode_categorical(row), dtype=torch.long)

        numeric_vals = row[self.numeric_columns].astype(float).to_numpy(dtype=np.float32)
        numeric_tensor = torch.tensor(
            (numeric_vals - self.numeric_means) / self.numeric_stds, dtype=torch.float32
        )

        highlight_tensor = torch.tensor(self._encode_highlights(row["filtered_highlights"]), dtype=torch.float32)
        label = torch.tensor(float(row["is_recommended"]), dtype=torch.float32)

        return cat_indices, numeric_tensor, highlight_tensor, label


def build_category_mapping(values: Iterable[str]) -> Dict[str, int]:
    mapping = {"<unk>": 0}
    idx = 1
    for value in values:
        if value in mapping:
            continue
        mapping[value] = idx
        idx += 1
    return mapping


def compute_numeric_stats(frame: pd.DataFrame, columns: Sequence[str]) -> Dict[str, np.ndarray]:
    data = frame[list(columns)].astype(float)
    mean = data.mean().to_numpy(dtype=np.float32)
    std_series = data.std().fillna(0.0).replace(0, 1.0)
    std = std_series.to_numpy(dtype=np.float32)
    std[std == 0] = 1.0
    return {"mean": mean, "std": std}
