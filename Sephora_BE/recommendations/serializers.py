from __future__ import annotations

from rest_framework import serializers


class SkinProfileSerializer(serializers.Serializer):
    skin_type = serializers.CharField(required=False, allow_blank=True)
    skin_concerns = serializers.ListField(
        child=serializers.CharField(), allow_empty=True, required=False
    )
    age_range = serializers.CharField(required=False, allow_blank=True)
    skin_tone = serializers.CharField(required=False, allow_blank=True)
    eye_color = serializers.CharField(required=False, allow_blank=True)
    hair_color = serializers.CharField(required=False, allow_blank=True)
    fragrance_pref = serializers.CharField(required=False, allow_blank=True)
    allergy_info = serializers.CharField(required=False, allow_blank=True)
    budget_level = serializers.CharField(required=False, allow_blank=True)
    climate = serializers.CharField(required=False, allow_blank=True)
    routine_focus = serializers.CharField(required=False, allow_blank=True)
    save_profile = serializers.BooleanField(required=False, default=False)
    legacy_author_id = serializers.CharField(required=False, allow_blank=True)


class PersonalizedSearchRequestSerializer(serializers.Serializer):
    search_query = serializers.CharField(required=False, allow_blank=True)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=10, default=10)
    session_id = serializers.CharField(required=False, allow_blank=True)
    user_email = serializers.EmailField(required=False)
    skin_profile = SkinProfileSerializer(required=True)


class PersonalizedFeedbackSerializer(serializers.Serializer):
    session_id = serializers.CharField(max_length=64)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    helpful = serializers.BooleanField(required=False, allow_null=True)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    experience_tags = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        allow_empty=True,
    )

