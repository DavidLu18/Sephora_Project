from rest_framework import serializers
from .models import ProductQuestion, ProductAnswer

class ProductAnswerSerializer(serializers.ModelSerializer):
    answered_by = serializers.SerializerMethodField()

    class Meta:
        model = ProductAnswer
        fields = ['id', 'content', 'answered_by', 'created_at']

    def get_answered_by(self, obj):
        return "Anonymous"  # 👈 Luôn hiển thị ẩn danh


class ProductQuestionSerializer(serializers.ModelSerializer):
    asked_by = serializers.SerializerMethodField()
    answers = ProductAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = ProductQuestion
        fields = [
            'id', 'product', 'content', 'asked_by', 'helpful_count',
            'is_public', 'created_at', 'answers'
        ]
        read_only_fields = ['product', 'asked_by', 'helpful_count', 'is_public', 'created_at']

    def get_asked_by(self, obj):
        return "Anonymous"  # 👈 Luôn hiển thị ẩn danh
