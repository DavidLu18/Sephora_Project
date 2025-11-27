"""Data preparation pipeline for Sephora personalized recommendation DNN.

This script ingests the raw CSV exports, performs basic cleaning/feature
selection, joins review interactions with product metadata, and materializes
train/validation/test parquet files for downstream model training.

Usage:
    python scripts/prepare_data.py

Outputs (written under D:/Model_AI_Sephora/processed/):
    - dnn_train.parquet
    - dnn_val.parquet
    - dnn_test.parquet
    - highlights_top.json (top highlight tags retained by the pipeline)
"""

from __future__ import annotations

import argparse
import ast
import json
from pathlib import Path
from typing import Iterable, List

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
PROCESSED_DIR = BASE_DIR / "processed"


REVIEW_FILES = [
    DATA_DIR / "reviews_0-250.csv",
    DATA_DIR / "reviews_250-500.csv",
    DATA_DIR / "reviews_500-750.csv",
    DATA_DIR / "reviews_750-1250.csv",
    DATA_DIR / "reviews_1250-end.csv",
]

REVIEW_COLUMNS = {
    "author_id": "author_id",
    "rating": "rating",
    "is_recommended": "is_recommended",
    "submission_time": "submission_time",
    "skin_tone": "skin_tone",
    "eye_color": "eye_color",
    "skin_type": "skin_type",
    "hair_color": "hair_color",
    "product_id": "product_id",
}

PRODUCT_COLUMNS = [
    "product_id",
    "brand_id",
    "brand_name",
    "loves_count",
    "rating",
    "price_usd",
    "limited_edition",
    "new",
    "online_only",
    "out_of_stock",
    "sephora_exclusive",
    "highlights",
    "primary_category",
    "secondary_category",
    "tertiary_category",
    "child_count",
]

TOP_HIGHLIGHT_COUNT = 50


def _safe_eval_list(cell: str | float) -> List[str]:
    if isinstance(cell, float) and np.isnan(cell):
        return []
    if isinstance(cell, list):
        return [str(item).strip() for item in cell]
    if not isinstance(cell, str):
        return []
    try:
        parsed = ast.literal_eval(cell)
    except (ValueError, SyntaxError):
        return []
    if isinstance(parsed, (list, tuple)):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return []


def _normalize_category(value: str | float) -> str:
    if isinstance(value, float) and np.isnan(value):
        return "<unk>"
    if value is None:
        return "<unk>"
    value_str = str(value).strip()
    return value_str.lower() if value_str else "<unk>"


def load_products() -> pd.DataFrame:
    product_path = DATA_DIR / "product_info.csv"
    products = pd.read_csv(product_path, usecols=PRODUCT_COLUMNS)
    products["product_id"] = products["product_id"].astype(str)
    products["brand_id"] = products["brand_id"].fillna(-1).astype(int).astype(str)
    products["primary_category"] = products["primary_category"].apply(_normalize_category)
    products["secondary_category"] = products["secondary_category"].apply(_normalize_category)
    products["tertiary_category"] = products["tertiary_category"].apply(_normalize_category)
    products["highlights_list"] = products["highlights"].apply(_safe_eval_list)
    return products


def compute_top_highlights(products: pd.DataFrame, k: int) -> List[str]:
    counter: dict[str, int] = {}
    for highlights in products["highlights_list"]:
        for tag in highlights:
            counter[tag] = counter.get(tag, 0) + 1
    sorted_tags = sorted(counter.items(), key=lambda kv: kv[1], reverse=True)
    return [tag for tag, _ in sorted_tags[:k]]


def read_reviews() -> pd.DataFrame:
    frames: List[pd.DataFrame] = []
    for path in REVIEW_FILES:
        if not path.exists():
            raise FileNotFoundError(f"Missing review shard: {path}")
        chunk_iter = pd.read_csv(
            path,
            usecols=list(REVIEW_COLUMNS.keys()),
            chunksize=200_000,
            dtype={
                "author_id": str,
                "product_id": str,
                "submission_time": str,
                "skin_tone": str,
                "eye_color": str,
                "skin_type": str,
                "hair_color": str,
            },
        )
        for chunk in chunk_iter:
            chunk = chunk.rename(columns=REVIEW_COLUMNS)
            chunk["author_id"] = chunk["author_id"].astype(str)
            chunk["product_id"] = chunk["product_id"].astype(str)
            chunk["rating"] = pd.to_numeric(chunk["rating"], errors="coerce")
            chunk["is_recommended"] = chunk["is_recommended"].fillna((chunk["rating"] >= 4).astype(float))
            chunk["is_recommended"] = chunk["is_recommended"].fillna(0).astype(int)
            chunk = chunk.dropna(subset=["author_id", "product_id"])
            chunk["submission_time"] = pd.to_datetime(chunk["submission_time"], errors="coerce")
            chunk["skin_type"] = chunk["skin_type"].apply(_normalize_category)
            chunk["skin_tone"] = chunk["skin_tone"].apply(_normalize_category)
            chunk["eye_color"] = chunk["eye_color"].apply(_normalize_category)
            chunk["hair_color"] = chunk["hair_color"].apply(_normalize_category)
            chunk = chunk.sort_values("submission_time").drop_duplicates(["author_id", "product_id"], keep="last")
            frames.append(chunk)
    reviews = pd.concat(frames, ignore_index=True)
    reviews = reviews.dropna(subset=["rating"])
    return reviews


def attach_products(reviews: pd.DataFrame, products: pd.DataFrame) -> pd.DataFrame:
    merged = reviews.merge(products, on="product_id", how="inner", validate="many_to_one")
    merged = merged[merged["brand_id"].notna()]
    return merged


def filter_highlights(merged: pd.DataFrame, top_highlights: Iterable[str]) -> pd.DataFrame:
    top_set = set(top_highlights)

    def keep_tags(tags: List[str]) -> List[str]:
        return [tag for tag in tags if tag in top_set]

    merged["filtered_highlights"] = merged["highlights_list"].apply(keep_tags)
    return merged


def stratified_user_split(df: pd.DataFrame, random_state: int = 42):
    users = df["author_id"].unique()
    train_users, temp_users = train_test_split(users, test_size=0.2, random_state=random_state)
    val_users, test_users = train_test_split(temp_users, test_size=0.5, random_state=random_state)

    train_mask = df["author_id"].isin(train_users)
    val_mask = df["author_id"].isin(val_users)
    test_mask = df["author_id"].isin(test_users)

    return df[train_mask], df[val_mask], df[test_mask]


def serialize_splits(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame) -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_parquet(PROCESSED_DIR / "dnn_train.parquet", index=False)
    val_df.to_parquet(PROCESSED_DIR / "dnn_val.parquet", index=False)
    test_df.to_parquet(PROCESSED_DIR / "dnn_test.parquet", index=False)


def persist_highlights(top_highlights: List[str]) -> None:
    output_path = PROCESSED_DIR / "highlights_top.json"
    with output_path.open("w", encoding="utf-8") as f:
        json.dump({"top_highlights": top_highlights}, f, ensure_ascii=False, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare dataset for DNN training")
    parser.add_argument("--top-highlights", type=int, default=TOP_HIGHLIGHT_COUNT, help="Number of highlight tags to retain")
    args = parser.parse_args()

    print("Loading product metadata...")
    products = load_products()
    top_highlights = compute_top_highlights(products, args.top_highlights)
    print(f"Retaining top {len(top_highlights)} highlight tags")

    print("Reading review shards...")
    reviews = read_reviews()
    print(f"Collected {len(reviews):,} unique user-product interactions")

    print("Joining reviews with products...")
    merged = attach_products(reviews, products)
    merged = filter_highlights(merged, top_highlights)

    if "rating_y" in merged.columns:
        merged = merged.rename(columns={"rating_y": "catalog_rating"})
    else:
        merged["catalog_rating"] = 0.0

    merged["review_rating"] = merged.get("rating_x", 0.0).fillna(0.0)

    max_submission = merged["submission_time"].max()
    merged["interaction_recency_days"] = (
        (max_submission - merged["submission_time"]).dt.total_seconds() / 86400.0
    ).fillna(0.0)

    feature_columns = [
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
        "is_recommended",
        "filtered_highlights",
        "interaction_recency_days",
    ]

    dataset = merged[feature_columns].copy()
    dataset["loves_count"] = dataset["loves_count"].fillna(0).astype(float)
    dataset["catalog_rating"] = dataset["catalog_rating"].fillna(0).astype(float)
    dataset["review_rating"] = dataset["review_rating"].fillna(0).astype(float)
    dataset["price_usd"] = dataset["price_usd"].fillna(0).astype(float)
    dataset["child_count"] = dataset["child_count"].fillna(0).astype(float)
    for flag in ["limited_edition", "new", "online_only", "out_of_stock", "sephora_exclusive"]:
        dataset[flag] = dataset[flag].fillna(0).astype(int)

    dataset["interaction_recency_days"] = dataset["interaction_recency_days"].fillna(dataset["interaction_recency_days"].median())

    # Log-scaled features (independent of target)
    dataset["log_loves_count"] = np.log1p(dataset["loves_count"])
    dataset["log_price_usd"] = np.log1p(dataset["price_usd"].clip(lower=0))

    category_mean_price = dataset.groupby("primary_category")["price_usd"].transform("mean").replace(0, np.nan)
    dataset["price_to_category_ratio"] = (
        dataset["price_usd"] / category_mean_price.replace(0, np.nan)
    ).fillna(0.0)

    dataset = dataset.dropna(subset=["is_recommended"])

    print("Splitting dataset into train/val/test (user-stratified)...")
    train_df, val_df, test_df = stratified_user_split(dataset)

    def augment_with_reference(df: pd.DataFrame, reference: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        user_stats = reference.groupby("author_id").agg(
            user_total_interactions=("is_recommended", "count"),
            user_positive_interactions=("is_recommended", "sum"),
            user_avg_review_rating=("review_rating", "mean"),
        )
        user_stats["user_positive_rate"] = (
            user_stats["user_positive_interactions"] / user_stats["user_total_interactions"].replace(0, np.nan)
        )

        product_stats = reference.groupby("product_id").agg(
            product_total_interactions=("is_recommended", "count"),
            product_positive_interactions=("is_recommended", "sum"),
            product_avg_review_rating=("review_rating", "mean"),
        )
        product_stats["product_positive_rate"] = (
            product_stats["product_positive_interactions"] / product_stats["product_total_interactions"].replace(0, np.nan)
        )

        df = df.merge(user_stats, on="author_id", how="left")
        df = df.merge(product_stats, on="product_id", how="left")

        df["user_total_interactions"] = df["user_total_interactions"].fillna(0).astype(float)
        df["user_positive_interactions"] = df["user_positive_interactions"].fillna(0).astype(float)
        df["user_positive_rate"] = df["user_positive_rate"].fillna(0.0)
        df["user_avg_review_rating"] = df["user_avg_review_rating"].fillna(0.0)

        df["product_total_interactions"] = df["product_total_interactions"].fillna(0).astype(float)
        df["product_positive_interactions"] = df["product_positive_interactions"].fillna(0).astype(float)
        df["product_positive_rate"] = df["product_positive_rate"].fillna(0.0)
        df["product_avg_review_rating"] = df["product_avg_review_rating"].fillna(0.0)

        df = df.drop(columns=["user_positive_interactions", "product_positive_interactions"], errors="ignore")
        return df

    train_df = augment_with_reference(train_df, train_df)
    val_df = augment_with_reference(val_df, train_df)
    test_df = augment_with_reference(test_df, train_df)
    print(
        "Split sizes -> train: {:,}, val: {:,}, test: {:,}".format(
            len(train_df), len(val_df), len(test_df)
        )
    )

    print("Serializing parquet files...")
    serialize_splits(train_df, val_df, test_df)
    persist_highlights(top_highlights)

    print("Data preparation completed successfully.")


if __name__ == "__main__":
    main()
