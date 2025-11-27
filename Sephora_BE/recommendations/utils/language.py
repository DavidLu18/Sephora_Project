from __future__ import annotations

from typing import Dict, List


SKIN_TYPE_MAP: Dict[str, str] = {
    "da dầu": "oily",
    "da khô": "dry",
    "da hỗn hợp": "combination",
    "da nhạy cảm": "sensitive",
    "da thường": "normal",
}

SKIN_CONCERN_MAP: Dict[str, str] = {
    "mụn": "acne",
    "mụn/ mụn đầu đen": "acne",
    "mụn đầu đen": "acne",
    "mụn trứng cá": "acne",
    "thâm": "dark_spots",
    "sạm": "dark_spots",
    "nám": "dark_spots",
    "lão hóa": "wrinkles",
    "nếp nhăn": "wrinkles",
    "khô": "dryness",
    "thiếu ẩm": "dryness",
    "da đỏ": "redness",
    "kích ứng": "redness",
    "lỗ chân lông to": "large_pores",
}

FRAGRANCE_MAP: Dict[str, str] = {
    "không hương": "no_fragrance",
    "không mùi": "no_fragrance",
    "hương nhẹ": "light",
    "hương hoa": "floral",
    "hương tươi mát": "fresh",
    "hương gỗ": "woody",
}

GENERAL_TEXT_MAP: Dict[str, str] = {
    "không": "no",
}


def map_value(value: str | None, mapping: Dict[str, str]) -> str | None:
    if not value:
        return value
    normalized = value.strip().lower()
    return mapping.get(normalized, value)


def map_list(values: List[str], mapping: Dict[str, str]) -> List[str]:
    normalized = []
    for val in values:
        mapped = map_value(val, mapping)
        if mapped:
            normalized.append(mapped)
    return normalized


def normalize_skin_profile_language(profile: Dict[str, object]) -> Dict[str, object]:
    """Convert Vietnamese synonyms to the English tokens used by the DNN."""

    profile = profile.copy()
    profile["skin_type"] = map_value(profile.get("skin_type"), SKIN_TYPE_MAP) or profile.get(
        "skin_type"
    )

    concerns = profile.get("skin_concerns") or []
    if isinstance(concerns, str):
        concerns = [concerns]
    profile["skin_concerns"] = map_list([str(c) for c in concerns], SKIN_CONCERN_MAP)

    profile["fragrance_pref"] = (
        map_value(profile.get("fragrance_pref"), FRAGRANCE_MAP) or profile.get("fragrance_pref")
    )

    allergy = profile.get("allergy_info")
    if isinstance(allergy, str):
        profile["allergy_info"] = " ".join(
            GENERAL_TEXT_MAP.get(part.lower().strip(), part) for part in allergy.split()
        )

    return profile


