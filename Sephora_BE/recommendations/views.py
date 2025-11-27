from __future__ import annotations

import logging
import math
import numpy as np
import unicodedata
import uuid
from collections import Counter, defaultdict
from typing import List, Set, Tuple

from django.conf import settings
from django.db.models import Avg, Case, Count, IntegerField, Q, When
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from products.models import Product
from products.serializers import ProductSerializer
from users.models import User, get_user_role

from .models import (
    PersonalizedFeedback,
    PersonalizedSearchLog,
    ProductFeatureSnapshot,
    RecommendationConfig,
)
from .serializers import PersonalizedFeedbackSerializer, PersonalizedSearchRequestSerializer
from .services import (
    DNNRecommendationService,
    NCFRecommendationService,
    ProductMetadataRepository,
    RecommendationReasonBuilder,
)
from .services.content_filter import CONTENT_FILTER
from .utils.language import normalize_skin_profile_language


METADATA_REPO = ProductMetadataRepository(
    settings.ML_ARTIFACTS.get("PRODUCT_CSV", settings.BASE_DIR / "data" / "product_info.csv")
)
DNN_SERVICE = DNNRecommendationService(settings.ML_ARTIFACTS["DNN_DIR"])
NCF_SERVICE = NCFRecommendationService(settings.ML_ARTIFACTS["NCF_DIR"])
REASON_BUILDER = RecommendationReasonBuilder()
LOGGER = logging.getLogger(__name__)

SEARCH_KEYWORD_MAP = {
    "sua rua mat": {
        "terms": ["sua rua mat", "sua rua", "cleanser", "face wash", "facial cleanser"],
        "categories": ["Cleanser", "Cleansers"],
    },
    "tay trang": {
        "terms": ["tay trang", "makeup remover", "cleansing oil"],
        "categories": ["Makeup Remover"],
    },
    "serum": {
        "terms": ["serum", "treatment"],
        "categories": ["Serum"],
    },
    "kem chong nang": {
        "terms": ["kem chong nang", "sunscreen", "sun screen", "spf"],
        "categories": ["Sunscreen"],
    },
    "kcn": {
        "terms": ["kcn", "sunscreen", "spf"],
        "categories": ["Sunscreen"],
    },
    "kem duong": {
        "terms": ["kem duong", "moisturizer", "cream"],
        "categories": ["Moisturizer", "Face Moisturizer"],
    },
    "mat na": {
        "terms": ["mat na", "mask"],
        "categories": ["Mask"],
    },
    "son": {
        "terms": ["son", "lipstick", "lip color"],
        "categories": ["Lipstick"],
    },
    "phan mat": {
        "terms": ["phan mat", "eyeshadow"],
        "categories": ["Eyeshadow"],
    },
    "phan ma": {
        "terms": ["phan ma", "blush"],
        "categories": ["Blush"],
    },
    "ke mat": {
        "terms": ["ke mat", "eyeliner"],
        "categories": ["Eyeliner"],
    },
    "nuoc hoa": {
        "terms": ["nuoc hoa", "perfume", "fragrance"],
        "categories": ["Fragrance"],
    },
    "dau goi": {
        "terms": ["dau goi", "shampoo"],
        "categories": ["Shampoo"],
    },
    "dau xa": {
        "terms": ["dau xa", "conditioner"],
        "categories": ["Conditioner"],
    },
    "sua tam": {
        "terms": ["sua tam", "body wash"],
        "categories": ["Body Wash"],
    },
}

BUDGET_THRESHOLDS_USD = {
    "under_500k": {"min": 0.0, "max": 22.0},
    "500k_1m": {"min": 18.0, "max": 43.0},
    "over_1m": {"min": 40.0, "max": None},
}

CLIMATE_KEYWORDS = {
    "hot_humid": {
        "positive": ["oil-free", "non-greasy", "gel", "foam", "matte", "lightweight"],
        "negative": ["rich", "butter", "heavy"],
    },
    "air_con": {
        "positive": ["hydrating", "moisture", "hyaluronic", "soothing", "calming"],
        "negative": [],
    },
    "cool_dry": {
        "positive": ["rich", "ceramide", "cream", "shea", "butter", "barrier"],
        "negative": ["oil-free", "matte"],
    },
}

ROUTINE_RULES = {
    "minimal": {
        "boost": ["cleanser", "cleaners", "moisturizer", "sunscreen"],
        "penalize": ["serum", "treatment", "mask", "peel", "essence"],
    },
    "advanced": {
        "boost": ["serum", "treatment", "essence", "ampoule", "booster"],
        "penalize": [],
    },
}


def _strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text or "")
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _expand_search_terms(search_query: str) -> Tuple[Set[str], Set[str]]:
    raw = (search_query or "").strip()
    if not raw:
        return set(), set()

    normalized_ascii = _strip_accents(raw).lower()
    terms = {raw}
    categories = set()

    if normalized_ascii and normalized_ascii != raw.lower():
        terms.add(normalized_ascii)

    for key, data in SEARCH_KEYWORD_MAP.items():
        if key in normalized_ascii:
            terms.update(data.get("terms", []))
            categories.update(data.get("categories", []))

    return {t for t in terms if t}, {c for c in categories if c}


def _resolve_user(email: str | None) -> User | None:
    if not email:
        return None
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def _derive_skin_profile(profile_data: dict, user: User | None) -> dict:
    profile = {**profile_data}
    if not profile.get("skin_type") and user and user.skintype:
        profile["skin_type"] = user.skintype
    if not profile.get("skin_concerns") and user and user.skinconcerns:
        profile["skin_concerns"] = [c.strip() for c in user.skinconcerns.split(",") if c.strip()]
    if not profile.get("age_range") and user and user.agerange:
        profile["age_range"] = user.agerange
    if not profile.get("skin_tone") and user and user.skin_tone:
        profile["skin_tone"] = user.skin_tone
    if not profile.get("hair_color") and user and user.hair_color:
        profile["hair_color"] = user.hair_color
    if not profile.get("eye_color") and user and user.eye_color:
        profile["eye_color"] = user.eye_color
    if not profile.get("fragrance_pref") and user and user.fragrance_pref:
        profile["fragrance_pref"] = user.fragrance_pref
    if not profile.get("allergy_info") and user and user.allergy_info:
        profile["allergy_info"] = user.allergy_info
    profile.setdefault("skin_concerns", [])
    return normalize_skin_profile_language(profile)


def _candidate_queryset(
    search_query: str | None,
    preferred_ids: List[int] | None = None,
    limit: int = 250,
) -> Tuple[List[Product], Set[str]]:
    base_qs = Product.objects.select_related("brand", "category").prefetch_related("images")
    qs = base_qs.filter(stock__gt=0)
    category_terms: Set[str] = set()
    if search_query:
        terms, category_terms = _expand_search_terms(search_query)
    else:
        terms = set()

    collected: List[Product] = []
    seen_ids: Set[int] = set()

    if preferred_ids:
        ordering = Case(
            *[When(productid=pid, then=pos) for pos, pid in enumerate(preferred_ids)],
            default=len(preferred_ids),
            output_field=IntegerField(),
        )
        preferred_qs = qs.filter(productid__in=preferred_ids).order_by(ordering)
        for product in preferred_qs:
            collected.append(product)
            seen_ids.add(product.productid)

    remaining = max(0, limit - len(collected))
    if remaining > 0:
        filtered_qs = qs.exclude(productid__in=seen_ids)
        filtered = None
        if terms:
            term_query = Q()
            for term in terms:
                term_query |= (
                    Q(product_name__icontains=term)
                    | Q(description__icontains=term)
                    | Q(sku__icontains=term)
                )
            if term_query:
                filtered = filtered_qs.filter(term_query)
        if (not filtered or not filtered.exists()) and category_terms:
            cat_q = Q()
            for category_term in category_terms:
                cat_q |= Q(category__category_name__icontains=category_term)
            if cat_q:
                filtered = (filtered_qs if filtered is None else filtered).filter(cat_q)
        fallback_qs = filtered if filtered and filtered.exists() else filtered_qs
        fallback_list = list(fallback_qs.order_by("-is_new", "-review_count", "-created_at")[:remaining])
        collected.extend(fallback_list)

    return collected[:limit], category_terms


def _metadata_for_product(product: Product):
    snapshot = getattr(product, "ml_feature_snapshot", None)
    if snapshot:
        return snapshot.to_metadata_row()
    snapshot = (
        ProductFeatureSnapshot.objects.filter(product=product).only("external_id").first()
    )
    if snapshot:
        return snapshot.to_metadata_row()
    return METADATA_REPO.match_product(product)


def _category_allows(metadata_row, product: Product, category_filters: Set[str]) -> bool:
    if not category_filters:
        return True
    meta_category = (metadata_row.primary_category or "").lower()
    product_category = (
        product.category.category_name.lower()
        if getattr(product, "category", None) and getattr(product.category, "category_name", None)
        else ""
    )
    for term in category_filters:
        if term in meta_category or term in product_category:
            return True
    return False


def _display_match_percentage(score: float, min_score: float, max_score: float) -> float:
    if max_score - min_score <= 1e-6:
        bounded = max(0.55, min(score, 0.98))
        return round(bounded * 100, 1)
    normalized = (score - min_score) / (max_score - min_score)
    normalized = max(0.0, min(1.0, normalized))
    bounded = 0.6 + normalized * 0.35  # 60% - 95%
    return round(bounded * 100, 1)


def _quantile_thresholds(scores: List[float]) -> dict:
    if len(scores) < 2:
        base = scores[0] if scores else 0.0
        return {"q10": base, "q30": base, "q50": base, "q70": base, "q90": base}
    quantiles = np.quantile(scores, [0.1, 0.3, 0.5, 0.7, 0.9]).tolist()
    return {"q10": quantiles[0], "q30": quantiles[1], "q50": quantiles[2], "q70": quantiles[3], "q90": quantiles[4]}


def _quantile_label(score: float, thresholds: dict) -> str:
    if score >= thresholds["q90"]:
        return "Xuất sắc"
    if score >= thresholds["q70"]:
        return "Rất tốt"
    if score >= thresholds["q50"]:
        return "Tốt"
    if score >= thresholds["q30"]:
        return "Khá"
    if score >= thresholds["q10"]:
        return "Tương đối"
    return "Khám phá thêm"


def _product_text(metadata_row, product: Product) -> str:
    parts = []
    if metadata_row.highlights:
        parts.extend(metadata_row.highlights)
    if metadata_row.ingredients:
        parts.extend(metadata_row.ingredients)
    if getattr(product, "description", None):
        parts.append(product.description)
    return " ".join(parts).lower()


def _apply_budget_rule(score: float, metadata_row, budget_level: str) -> float:
    bounds = BUDGET_THRESHOLDS_USD.get(budget_level)
    if not bounds:
        return score
    price = float(metadata_row.price_usd or 0.0)
    min_price = bounds.get("min")
    max_price = bounds.get("max")
    if price <= 0:
        return score
    if max_price is not None and price > max_price * 1.15:
        return score * 0.9
    if max_price is not None and price <= max_price:
        return score * 1.03
    if min_price is not None and price < min_price * 0.7:
        return score * 0.95
    if min_price is not None and price >= min_price:
        return score * 1.01
    return score


def _match_keyword(text: str, keywords: List[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _apply_climate_rule(score: float, metadata_row, product: Product, climate: str) -> float:
    rules = CLIMATE_KEYWORDS.get(climate)
    if not rules:
        return score
    text = _product_text(metadata_row, product)
    if rules["positive"] and _match_keyword(text, rules["positive"]):
        score *= 1.03
    if rules["negative"] and _match_keyword(text, rules["negative"]):
        score *= 0.95
    return score


def _apply_routine_rule(score: float, metadata_row, routine_focus: str) -> float:
    rules = ROUTINE_RULES.get(routine_focus)
    if not rules:
        return score
    category_text = " ".join(
        filter(
            None,
            [
                (metadata_row.primary_category or "").lower(),
                (metadata_row.secondary_category or "").lower(),
                (metadata_row.tertiary_category or "").lower(),
            ],
        )
    )
    if rules["boost"] and _match_keyword(category_text, rules["boost"]):
        score *= 1.03
    if rules["penalize"] and _match_keyword(category_text, rules["penalize"]):
        score *= 0.95
    return score


def _apply_business_rules(entries: List[dict], skin_profile: dict) -> None:
    """Boost/Penalize scores based on simple business heuristics."""
    brand_key_counts: defaultdict[str, int] = defaultdict(int)
    budget_level = (skin_profile.get("budget_level") or "").lower()
    climate = (skin_profile.get("climate") or "").lower()
    routine_focus = (skin_profile.get("routine_focus") or "").lower()

    for entry in entries:
        metadata = entry["metadata"]
        product = entry["product"]
        score = entry["final_score"]

        if metadata.out_of_stock:
            entry["final_score"] = -1.0
            continue

        if getattr(product, "is_new", False) or metadata.new:
            score *= 1.05
        if metadata.rating and metadata.rating >= 4.5:
            score *= 1.03
        if metadata.reviews and metadata.reviews >= 1000:
            score *= 1.02

        if budget_level:
            score = _apply_budget_rule(score, metadata, budget_level)
        if climate:
            score = _apply_climate_rule(score, metadata, product, climate)
        if routine_focus:
            score = _apply_routine_rule(score, metadata, routine_focus)

        entry["final_score"] = score
        brand = (metadata.brand_name or "").lower()
        brand_key_counts[brand] += 0
        entry["brand_key"] = brand

    brand_seen: defaultdict[str, int] = defaultdict(int)
    for entry in sorted(entries, key=lambda item: item["final_score"], reverse=True):
        brand = entry.get("brand_key") or ""
        if not brand:
            continue
        brand_seen[brand] += 1
        if brand_seen[brand] > 2:
            entry["final_score"] *= 0.95

    for entry in entries:
        entry.pop("brand_key", None)


def _get_request_email(request) -> str | None:
    if hasattr(request, "user") and getattr(request.user, "is_authenticated", False):
        return getattr(request.user, "email", None)
    return None


def _blend_scores(dnn_score: float, ncf_score: float | None, config: RecommendationConfig) -> float:
    dnn_weight = max(config.dnn_weight, 0.0)
    ncf_weight = max(config.ncf_weight, 0.0)

    if ncf_score is None or ncf_weight <= 0:
        if dnn_weight <= 0:
            return dnn_score
        return dnn_score

    total_weight = dnn_weight + ncf_weight
    if total_weight <= 0:
        return dnn_score
    return ((dnn_weight * dnn_score) + (ncf_weight * ncf_score)) / total_weight


def _build_record(metadata_row, skin_profile: dict, author_id: str) -> dict:
    record = metadata_row.to_feature_dict()
    category_avg_price = METADATA_REPO.category_avg_price(metadata_row.primary_category)
    price_ratio = 0.0
    if metadata_row.price_usd > 0 and category_avg_price > 0:
        price_ratio = float(metadata_row.price_usd) / category_avg_price

    log_price = math.log1p(metadata_row.price_usd) if metadata_row.price_usd > 0 else 0.0
    log_loves = math.log1p(metadata_row.loves_count) if metadata_row.loves_count > 0 else 0.0
    product_positive_rate = 0.0
    if metadata_row.rating > 0:
        product_positive_rate = min(max(metadata_row.rating / 5.0, 0.0), 1.0)

    record.update(
        {
            "author_id": author_id,
            "skin_type": skin_profile.get("skin_type", "<unk>") or "<unk>",
            "skin_tone": skin_profile.get("skin_tone", "<unk>") or "<unk>",
            "eye_color": skin_profile.get("eye_color", "<unk>") or "<unk>",
            "hair_color": skin_profile.get("hair_color", "<unk>") or "<unk>",
            "interaction_recency_days": 0.0,
            "user_total_interactions": 0.0,
            "user_positive_rate": 0.0,
            "user_avg_review_rating": 0.0,
            "product_total_interactions": metadata_row.reviews,
            "product_positive_rate": product_positive_rate,
            "product_avg_review_rating": metadata_row.rating,
            "log_loves_count": log_loves,
            "log_price_usd": log_price,
            "price_to_category_ratio": price_ratio,
        }
    )
    return record


def _allergy_safe(profile: dict, metadata_row) -> bool:
    allergy = (profile.get("allergy_info") or "").strip()
    if not allergy:
        return True
    ingredients_text = " ".join(metadata_row.ingredients)
    return allergy.lower() not in ingredients_text.lower()


def _maybe_update_user_profile(user: User | None, skin_profile_payload: dict) -> None:
    if not user or not skin_profile_payload.get("save_profile"):
        return
    fields_to_update = []
    mappings = {
        "skintype": skin_profile_payload.get("skin_type"),
        "skinconcerns": ",".join(skin_profile_payload.get("skin_concerns") or []),
        "agerange": skin_profile_payload.get("age_range"),
        "skin_tone": skin_profile_payload.get("skin_tone"),
        "hair_color": skin_profile_payload.get("hair_color"),
        "eye_color": skin_profile_payload.get("eye_color"),
        "fragrance_pref": skin_profile_payload.get("fragrance_pref"),
        "allergy_info": skin_profile_payload.get("allergy_info"),
    }
    for field, value in mappings.items():
        if value:
            setattr(user, field, value)
            fields_to_update.append(field)
    if fields_to_update:
        user.save(update_fields=list(set(fields_to_update)))


def _ensure_admin(request) -> bool:
    email = _get_request_email(request)
    return get_user_role(email) == "admin"


@api_view(["POST"])
def personalized_search(request):
    serializer = PersonalizedSearchRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    user = _resolve_user(payload.get("user_email"))
    session_id = payload.get("session_id") or uuid.uuid4().hex
    skin_profile = _derive_skin_profile(payload["skin_profile"], user)
    config = RecommendationConfig.load()
    system_limit = min(config.max_results, 10)
    requested_limit = payload.get("limit") or system_limit
    limit = max(1, min(requested_limit, system_limit))

    author_id = skin_profile.get("legacy_author_id") or (
        user.firebase_uid if user and user.firebase_uid else user.email if user else session_id
    )

    preferred_ids = CONTENT_FILTER.select_candidates(
        payload.get("search_query"),
        skin_profile,
        allergy_term=payload["skin_profile"].get("allergy_info"),
        limit=250,
    )

    candidates: List[dict] = []
    products, category_terms = _candidate_queryset(
        payload.get("search_query"),
        preferred_ids=preferred_ids,
    )
    category_filters = {term.lower() for term in category_terms}

    for product in products:
        metadata_row = _metadata_for_product(product)
        if not metadata_row:
            continue
        if not _allergy_safe(payload["skin_profile"], metadata_row):
            continue
        if category_filters and not _category_allows(metadata_row, product, category_filters):
            continue
        candidates.append(
            {
                "product": product,
                "metadata": metadata_row,
                "record": _build_record(metadata_row, skin_profile, author_id),
            }
        )
        if len(candidates) >= 200:
            break

    if not candidates:
        return Response({"results": [], "personalized": False}, status=status.HTTP_200_OK)

    dnn_scores = DNN_SERVICE.score_records([c["record"] for c in candidates])
    if dnn_scores:
        LOGGER.info(
            "DNN scores sample count=%s min=%.4f max=%.4f first_ten=%s",
            len(dnn_scores),
            min(dnn_scores),
            max(dnn_scores),
            [round(score, 4) for score in dnn_scores[:10]],
        )
    legacy_author_id = skin_profile.get("legacy_author_id")
    entries: List[dict] = []

    for candidate, dnn_score in zip(candidates, dnn_scores):
        product = candidate["product"]
        metadata_row = candidate["metadata"]
        ncf_score = NCF_SERVICE.score(legacy_author_id, metadata_row.product_id) if legacy_author_id else None
        final_score = _blend_scores(dnn_score, ncf_score, config)
        reasons = REASON_BUILDER.build_reasons(
            product_metadata={
                "highlights": metadata_row.highlights,
                "ingredients_text": " ".join(metadata_row.ingredients),
                "skin_types": product.skin_types or "",
            },
            skin_profile=skin_profile,
            similar_user_count=metadata_row.reviews,
            allergy_match=True,
        )
        entries.append(
            {
                "product": product,
                "metadata": metadata_row,
                "reasons": reasons,
                "scores": {
                    "dnn": round(dnn_score, 4),
                    "ncf": round(ncf_score, 4) if ncf_score is not None else None,
                    "final": round(final_score, 4),
                },
                "final_score": final_score,
            }
        )

    if not entries:
        return Response({"results": [], "personalized": False}, status=status.HTTP_200_OK)

    _apply_business_rules(entries, skin_profile)

    entries.sort(key=lambda item: item["final_score"], reverse=True)
    raw_scores = [entry["final_score"] for entry in entries]

    if raw_scores:
        min_raw = min(raw_scores)
        max_raw = max(raw_scores)
        thresholds = _quantile_thresholds(raw_scores)
        scores_array = np.array(raw_scores)
        mean_raw = float(scores_array.mean())
        std_raw = float(scores_array.std())
        if std_raw < 1e-6:
            std_raw = 1e-6
        for entry, score in zip(entries, raw_scores):
            entry["match_percentage"] = _display_match_percentage(score, min_raw, max_raw)
            z_score = (score - mean_raw) / std_raw
            diff_percent = ((score - mean_raw) / max(mean_raw, 1e-6)) * 100.0
            entry["ranking"] = {
                "bucket_label": _quantile_label(score, thresholds),
                "z_score": round(z_score, 2),
                "diff_percent": round(diff_percent, 1),
            }

    limited_entries = entries[:limit]

    results: List[dict] = []
    for entry in limited_entries:
        product_payload = ProductSerializer(entry["product"], context={"request": request}).data
        results.append(
            {
                "product": product_payload,
                "match_percentage": entry.get("match_percentage", round(entry["final_score"] * 100, 1)),
                "reasons": entry["reasons"],
                "scores": entry["scores"],
                "ranking": entry.get("ranking"),
            }
        )

    PersonalizedSearchLog.objects.create(
        session_id=session_id,
        user=user,
        search_query=payload.get("search_query", ""),
        skin_profile=skin_profile,
        response_summary={
            "results": [
                {
                    "product_id": entry["product"].productid,
                    "score": entry["scores"]["final"],
                    "ranking": entry.get("ranking"),
                }
                for entry in limited_entries
            ],
            "search_query": payload.get("search_query", ""),
        },
    )

    _maybe_update_user_profile(user, payload["skin_profile"])

    response = {
        "session_id": session_id,
        "personalized": True,
        "results": results,
        "explanation": {
            "summary": "Kết quả dựa trên thông tin da và từ khóa bạn cung cấp",
            "factors": {
                "skin_type": skin_profile.get("skin_type"),
                "concerns": skin_profile.get("skin_concerns"),
                "age_range": skin_profile.get("age_range"),
            },
        },
    }
    return Response(response, status=status.HTTP_200_OK)


@api_view(["POST"])
def _maybe_schedule_retrain(feedback: PersonalizedFeedback) -> None:
    if feedback.retrain_required:
        LOGGER.warning(
            "Low rating feedback detected (rating=%s, session=%s). Consider scheduling DNN/NCF retraining.",
            feedback.rating,
            feedback.session_id,
        )


@api_view(["POST"])
def submit_personalized_feedback(request):
    serializer = PersonalizedFeedbackSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    session_id = payload["session_id"]

    log = (
        PersonalizedSearchLog.objects.filter(session_id=session_id)
        .order_by("-created_at")
        .first()
    )
    if not log:
        return Response(
            {"message": "Không tìm thấy phiên gợi ý để ghi nhận phản hồi."},
            status=status.HTTP_404_NOT_FOUND,
        )

    user = request.user if getattr(request.user, "is_authenticated", False) else None
    needs_review = payload["rating"] <= 2

    defaults = {
        "user": user or log.user,
        "session_id": session_id,
        "rating": payload["rating"],
        "helpful": payload.get("helpful"),
        "experience_tags": payload.get("experience_tags") or [],
        "comment": payload.get("comment", "").strip(),
        "retrain_required": needs_review,
    }

    feedback, created = PersonalizedFeedback.objects.update_or_create(
        log=log,
        defaults=defaults,
    )

    if needs_review:
        _maybe_schedule_retrain(feedback)

    return Response(
        {
            "message": "Cảm ơn bạn đã phản hồi!",
            "updated": not created,
            "id": feedback.id,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
def personalized_feedback_summary(request):
    if not _ensure_admin(request):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    summary = PersonalizedFeedback.objects.aggregate(
        avg_rating=Avg("rating"),
        total=Count("id"),
        low_count=Count("id", filter=Q(rating__lt=3)),
    )
    distribution = {
        item["rating"]: item["count"]
        for item in PersonalizedFeedback.objects.values("rating").annotate(count=Count("id"))
    }

    tag_counter: Counter[str] = Counter()
    for feedback in PersonalizedFeedback.objects.exclude(experience_tags=[]).only("experience_tags"):
        for tag in feedback.experience_tags:
            tag_counter[tag] += 1

    recent_low = [
        {
            "session_id": fb.session_id,
            "rating": fb.rating,
            "tags": fb.experience_tags,
            "comment": fb.comment,
            "created_at": fb.created_at.isoformat(),
            "retrain_required": fb.retrain_required,
        }
        for fb in PersonalizedFeedback.objects.filter(rating__lt=3)
        .order_by("-created_at")[:20]
    ]

    return Response(
        {
            "summary": {
                "average_rating": round(summary["avg_rating"] or 0.0, 2),
                "total_feedback": summary["total"],
                "low_rating_count": summary["low_count"],
            },
            "distribution": distribution,
            "tag_counts": dict(tag_counter),
            "recent_low_ratings": recent_low,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "PUT"])
def recommendation_config_view(request):
    config = RecommendationConfig.load()
    if request.method == "GET":
        return Response(config.as_dict(), status=status.HTTP_200_OK)

    if not _ensure_admin(request):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        dnn_weight = float(request.data.get("dnn_weight", config.dnn_weight))
        ncf_weight = float(request.data.get("ncf_weight", config.ncf_weight))
        max_results = int(request.data.get("max_results", config.max_results))
    except (TypeError, ValueError):
        return Response({"message": "Giá trị không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

    if dnn_weight < 0 or ncf_weight < 0:
        return Response({"message": "Trọng số phải >= 0."}, status=status.HTTP_400_BAD_REQUEST)
    if max_results < 1 or max_results > 50:
        return Response({"message": "max_results phải nằm trong khoảng 1-50."}, status=status.HTTP_400_BAD_REQUEST)

    config.dnn_weight = dnn_weight
    config.ncf_weight = ncf_weight
    config.max_results = max_results
    config.updated_by = _get_request_email(request) or "admin"
    config.save()
    return Response(config.as_dict(), status=status.HTTP_200_OK)

