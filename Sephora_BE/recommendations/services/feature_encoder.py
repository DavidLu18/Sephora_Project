from __future__ import annotations

from typing import Dict, Iterable, List

import torch


class DNNFeatureEncoder:
    """Encode python dictionaries into tensor triplets for the DNN."""

    def __init__(self, metadata: Dict[str, object]) -> None:
        self.categorical_features: List[str] = list(metadata["categorical_features"])
        self.categorical_maps: Dict[str, Dict[str, int]] = metadata["categorical_maps"]
        self.numeric_columns: List[str] = list(metadata["numeric_columns"])
        self.numeric_mean = torch.tensor(metadata["numeric_mean"], dtype=torch.float32)
        self.numeric_std = torch.tensor(metadata["numeric_std"], dtype=torch.float32)
        self.highlight_list: List[str] = list(metadata["highlight_list"])
        self.highlight_positions = {tag: idx for idx, tag in enumerate(self.highlight_list)}

    def encode_batch(self, records: Iterable[Dict[str, object]]):
        cat_rows = []
        numeric_rows = []
        highlight_rows = []
        for record in records:
            cat_rows.append(self._encode_categorical(record))
            numeric_rows.append(self._encode_numeric(record))
            highlight_rows.append(self._encode_highlights(record))
        categorical = torch.stack(cat_rows) if cat_rows else torch.zeros((0, len(self.categorical_features)))
        numeric = torch.stack(numeric_rows) if numeric_rows else torch.zeros((0, len(self.numeric_columns)))
        highlights = torch.stack(highlight_rows) if highlight_rows else torch.zeros((0, len(self.highlight_list)))
        return categorical.long(), numeric.float(), highlights.float()

    def _encode_categorical(self, record: Dict[str, object]) -> torch.Tensor:
        indices = []
        for feature in self.categorical_features:
            mapping = self.categorical_maps.get(feature, {"<unk>": 0})
            value = record.get(feature)
            value_str = str(value).strip() if value not in (None, "") else "<unk>"
            idx = mapping.get(value_str, mapping.get("<unk>", 0))
            indices.append(idx)
        return torch.tensor(indices, dtype=torch.long)

    def _encode_numeric(self, record: Dict[str, object]) -> torch.Tensor:
        values = []
        for idx, column in enumerate(self.numeric_columns):
            raw = record.get(column, 0.0)
            try:
                numeric_value = float(raw)
            except (TypeError, ValueError):
                numeric_value = 0.0
            mean = float(self.numeric_mean[idx])
            std = float(self.numeric_std[idx]) or 1.0
            values.append((numeric_value - mean) / std)
        return torch.tensor(values, dtype=torch.float32)

    def _encode_highlights(self, record: Dict[str, object]) -> torch.Tensor:
        vec = torch.zeros(len(self.highlight_list), dtype=torch.float32)
        highlights = record.get("filtered_highlights") or []
        for tag in highlights:
            idx = self.highlight_positions.get(str(tag))
            if idx is not None:
                vec[idx] = 1.0
        return vec

