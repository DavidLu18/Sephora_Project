from __future__ import annotations

import logging
import threading
from typing import Dict, List

import math
import re

from products.models import Product
from ..models import ProductFeatureSnapshot

LOGGER = logging.getLogger(__name__)


TOKEN_PATTERN = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> List[str]:
    return TOKEN_PATTERN.findall(text.lower())


def _build_document(product: Product, snapshot: ProductFeatureSnapshot | None) -> str:
    parts: List[str] = [
        product.product_name or "",
        product.description or "",
        product.skin_types or "",
        product.highlight or "",
    ]
    if snapshot:
        parts.extend(
            [
                snapshot.brand_name or "",
                snapshot.primary_category or "",
                snapshot.secondary_category or "",
                snapshot.tertiary_category or "",
                " ".join(snapshot.highlights or []),
                " ".join(snapshot.ingredients or []),
            ]
        )
    return " ".join(parts)


def _normalize_query(search_query: str, skin_profile: dict) -> str:
    tokens = [search_query or ""]
    tokens.append(skin_profile.get("skin_type") or "")
    tokens.extend(skin_profile.get("skin_concerns") or [])
    if skin_profile.get("age_range"):
        tokens.append(f"age:{skin_profile['age_range']}")
    if skin_profile.get("fragrance_pref"):
        tokens.append(skin_profile["fragrance_pref"])
    return " ".join(tokens)


class ContentBasedFilter:
    """Lightweight TF scores to narrow candidate products without external deps."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._doc_vectors: List[Dict[str, float]] = []
        self._doc_norms: List[float] = []
        self._idf: Dict[str, float] = {}
        self._product_ids: List[int] = []
        self._snapshot_by_product: Dict[int, ProductFeatureSnapshot] = {}
        self._loaded = False

    def refresh(self) -> None:
        with self._lock:
            self._load()

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        with self._lock:
            if not self._loaded:
                self._load()
                self._loaded = True

    def _load(self) -> None:
        tokens_per_doc: List[Dict[str, int]] = []
        doc_freq: Dict[str, int] = {}
        ids: List[int] = []
        self._snapshot_by_product.clear()

        snapshots = ProductFeatureSnapshot.objects.select_related("product").all()
        for snapshot in snapshots:
            product = snapshot.product
            doc = _build_document(product, snapshot)
            tokens = _tokenize(doc)
            if not tokens:
                continue
            token_counts: Dict[str, int] = {}
            for token in tokens:
                token_counts[token] = token_counts.get(token, 0) + 1
            for token in token_counts.keys():
                doc_freq[token] = doc_freq.get(token, 0) + 1
            tokens_per_doc.append(token_counts)
            ids.append(product.productid)
            self._snapshot_by_product[product.productid] = snapshot

        if not tokens_per_doc:
            self._doc_vectors = []
            self._doc_norms = []
            self._idf = {}
            self._product_ids = []
            LOGGER.warning("ContentBasedFilter: no product documents available.")
            return

        total_docs = len(tokens_per_doc)
        self._idf = {
            token: math.log((total_docs + 1) / (freq + 1)) + 1.0 for token, freq in doc_freq.items()
        }
        self._doc_vectors = []
        self._doc_norms = []
        self._product_ids = ids

        for token_counts in tokens_per_doc:
            length = sum(token_counts.values()) or 1
            vector: Dict[str, float] = {}
            for token, count in token_counts.items():
                tf = count / length
                vector[token] = tf * self._idf.get(token, 1.0)
            norm = math.sqrt(sum(value * value for value in vector.values())) or 1.0
            self._doc_vectors.append(vector)
            self._doc_norms.append(norm)

        LOGGER.info("ContentBasedFilter indexed %s products for candidate selection", len(ids))

    def _cosine(self, vec: Dict[str, float], norm: float, query_vec: Dict[str, float], query_norm: float) -> float:
        dot = 0.0
        for token, value in query_vec.items():
            dot += value * vec.get(token, 0.0)
        if not dot or not norm or not query_norm:
            return 0.0
        return dot / (norm * query_norm)

    def select_candidates(
        self,
        search_query: str | None,
        skin_profile: dict,
        allergy_term: str | None = None,
        limit: int = 250,
    ) -> List[int]:
        self._ensure_loaded()
        if not self._doc_vectors or not self._product_ids:
            return []

        query_text = _normalize_query(search_query or "", skin_profile)
        tokens = _tokenize(query_text)
        if not tokens:
            return []

        counts: Dict[str, int] = {}
        for token in tokens:
            counts[token] = counts.get(token, 0) + 1
        total = sum(counts.values()) or 1
        query_vector: Dict[str, float] = {
            token: (count / total) * self._idf.get(token, 1.0) for token, count in counts.items()
        }
        query_norm = math.sqrt(sum(v * v for v in query_vector.values())) or 1.0

        similarities: List[tuple[float, int]] = []
        for vector, norm, product_id in zip(self._doc_vectors, self._doc_norms, self._product_ids):
            sim = self._cosine(vector, norm, query_vector, query_norm)
            if sim > 0:
                similarities.append((sim, product_id))

        similarities.sort(key=lambda item: item[0], reverse=True)
        ranked_ids: List[int] = []
        allergy = (allergy_term or "").strip().lower()

        for sim, product_id in similarities:
            if allergy:
                snapshot = self._snapshot_by_product.get(product_id)
                if snapshot and any(
                    allergy in (ingredient or "").lower() for ingredient in (snapshot.ingredients or [])
                ):
                    continue
            ranked_ids.append(product_id)
            if limit and len(ranked_ids) >= limit:
                break

        return ranked_ids


CONTENT_FILTER = ContentBasedFilter()

