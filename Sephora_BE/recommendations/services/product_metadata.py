from __future__ import annotations

import ast
import csv
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Optional


def _parse_list(cell: str | None) -> list[str]:
    if not cell:
        return []
    try:
        parsed = ast.literal_eval(cell)
    except (ValueError, SyntaxError):
        parsed = None
    if isinstance(parsed, (list, tuple)):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return [item.strip() for item in cell.split("|") if item.strip()]


def _to_float(value: str | None) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _to_int(value: str | None) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


@dataclass(slots=True)
class ProductMetadataRow:
    product_id: str
    product_name: str
    brand_id: str
    brand_name: str
    loves_count: int
    rating: float
    reviews: int
    price_usd: float
    value_price_usd: float
    sale_price_usd: float
    limited_edition: int
    new: int
    online_only: int
    out_of_stock: int
    sephora_exclusive: int
    highlights: list[str]
    ingredients: list[str]
    primary_category: str
    secondary_category: str
    tertiary_category: str
    child_count: int
    child_min_price: float
    child_max_price: float

    def to_feature_dict(self) -> Dict[str, object]:
        return {
            "product_id": self.product_id,
            "brand_id": self.brand_id,
            "primary_category": self.primary_category or "<unk>",
            "secondary_category": self.secondary_category or "<unk>",
            "tertiary_category": self.tertiary_category or "<unk>",
            "loves_count": self.loves_count,
            "catalog_rating": self.rating,
            "review_rating": self.rating,
            "price_usd": self.price_usd,
            "value_price_usd": self.value_price_usd,
            "sale_price_usd": self.sale_price_usd,
            "limited_edition": self.limited_edition,
            "new": self.new,
            "online_only": self.online_only,
            "out_of_stock": self.out_of_stock,
            "sephora_exclusive": self.sephora_exclusive,
            "child_count": self.child_count,
            "child_min_price": self.child_min_price,
            "child_max_price": self.child_max_price,
            "filtered_highlights": self.highlights,
        }


class ProductMetadataRepository:
    """In-memory catalog built from the training CSV exports."""

    def __init__(self, csv_path: Path | str) -> None:
        self.csv_path = Path(csv_path)
        self._lock = threading.Lock()
        self._by_product_id: Dict[str, ProductMetadataRow] = {}
        self._by_name: Dict[str, ProductMetadataRow] = {}
        self._category_price_sum: Dict[str, float] = {}
        self._category_price_count: Dict[str, int] = {}
        self._load()

    def _load(self) -> None:
        with self._lock:
            if self._by_product_id:
                return
            if not self.csv_path.exists():
                return
            with self.csv_path.open(encoding="utf-8") as fp:
                reader = csv.DictReader(fp)
                for row in reader:
                    product_id = (row.get("product_id") or "").strip()
                    product_name = (row.get("product_name") or "").strip()
                    if not product_id:
                        continue
                    entry = ProductMetadataRow(
                        product_id=product_id,
                        product_name=product_name,
                        brand_id=(row.get("brand_id") or "").strip(),
                        brand_name=(row.get("brand_name") or "").strip(),
                        loves_count=_to_int(row.get("loves_count")),
                        rating=_to_float(row.get("rating")),
                        reviews=_to_int(row.get("reviews")),
                        price_usd=_to_float(row.get("price_usd")),
                        value_price_usd=_to_float(row.get("value_price_usd")),
                        sale_price_usd=_to_float(row.get("sale_price_usd")),
                        limited_edition=_to_int(row.get("limited_edition")),
                        new=_to_int(row.get("new")),
                        online_only=_to_int(row.get("online_only")),
                        out_of_stock=_to_int(row.get("out_of_stock")),
                        sephora_exclusive=_to_int(row.get("sephora_exclusive")),
                        highlights=_parse_list(row.get("highlights")),
                        ingredients=_parse_list(row.get("ingredients")),
                        primary_category=(row.get("primary_category") or "").strip(),
                        secondary_category=(row.get("secondary_category") or "").strip(),
                        tertiary_category=(row.get("tertiary_category") or "").strip(),
                        child_count=_to_int(row.get("child_count")),
                        child_min_price=_to_float(row.get("child_min_price")),
                        child_max_price=_to_float(row.get("child_max_price")),
                    )
                    self._by_product_id[product_id.upper()] = entry
                    key = product_name.lower()
                    if key:
                        self._by_name[key] = entry

                    category_key = (entry.primary_category or "<unk>").strip().lower()
                    self._category_price_sum[category_key] = (
                        self._category_price_sum.get(category_key, 0.0) + entry.price_usd
                    )
                    self._category_price_count[category_key] = (
                        self._category_price_count.get(category_key, 0) + 1
                    )

    def find_by_product_id(self, product_id: str | None) -> Optional[ProductMetadataRow]:
        if not product_id:
            return None
        return self._by_product_id.get(str(product_id).upper())

    def find_by_name(self, product_name: str | None) -> Optional[ProductMetadataRow]:
        if not product_name:
            return None
        return self._by_name.get(product_name.lower())

    def match_product(self, product) -> Optional[ProductMetadataRow]:
        """Best-effort match between DB product and metadata row."""
        entry = None
        sku = getattr(product, "sku", None)
        if sku:
            entry = self.find_by_product_id(sku)
        if entry:
            return entry
        # fallback to product_name
        entry = self.find_by_product_id(getattr(product, "productid", None))
        if entry:
            return entry
        return self.find_by_name(getattr(product, "product_name", None))

    def all_metadata(self) -> Iterable[ProductMetadataRow]:
        return self._by_product_id.values()

    def category_avg_price(self, category: str | None) -> float:
        key = (category or "<unk>").strip().lower()
        total = self._category_price_sum.get(key)
        count = self._category_price_count.get(key, 0)
        if not total or count == 0:
            return 0.0
        return total / count

