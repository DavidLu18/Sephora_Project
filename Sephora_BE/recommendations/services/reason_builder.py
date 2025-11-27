from __future__ import annotations

from typing import Dict, List, Sequence


class RecommendationReasonBuilder:
    """Generate human-friendly reason snippets for each recommendation."""

    CONCERN_MAP = {
        "acne": "giúp giảm mụn",
        "dark_spots": "hỗ trợ làm mờ thâm",
        "wrinkles": "giảm nếp nhăn",
        "dryness": "cấp ẩm sâu",
        "redness": "làm dịu da",
        "large_pores": "thu nhỏ lỗ chân lông",
    }

    def build_reasons(
        self,
        *,
        product_metadata: Dict[str, object],
        skin_profile: Dict[str, object],
        similar_user_count: int | None = None,
        allergy_match: bool = True,
    ) -> List[str]:
        reasons: List[str] = []
        skin_type = (skin_profile.get("skin_type") or "").lower()
        product_skin = (product_metadata.get("skin_types") or "").lower()
        if skin_type and skin_type in product_skin:
            reasons.append(f"Dành cho da {skin_type}")
        for concern in skin_profile.get("skin_concerns") or []:
            mapped = self.CONCERN_MAP.get(concern, concern)
            if concern.lower() in product_metadata.get("ingredients_text", "").lower():
                reasons.append(mapped)
        highlights = product_metadata.get("highlights") or []
        if highlights:
            reasons.append(f"Nổi bật: {', '.join(highlights[:2])}")
        if similar_user_count and similar_user_count > 0:
            reasons.append(f"{similar_user_count} người có tuýp da tương tự đã yêu thích")
        if not allergy_match:
            reasons.append("Không chứa thành phần bạn cần tránh")
        return reasons[:4]

