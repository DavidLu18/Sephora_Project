from rest_framework import serializers
from .models import ProductQuestion, ProductAnswer

class AdminProductAnswerSerializer(serializers.ModelSerializer):
    answered_by = serializers.CharField(source="answered_by.username", read_only=True)

    class Meta:
        model = ProductAnswer
        fields = ["id", "content", "answered_by", "created_at"]


class AdminProductQuestionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.product_name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_id = serializers.IntegerField(source="product.productid", read_only=True)
    asked_by = serializers.CharField(source="user.username", read_only=True)
    answers = AdminProductAnswerSerializer(many=True, read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductQuestion
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "product_id",    
            "content",
            "asked_by",
            "helpful_count",
            "is_public",
            "created_at",
            "status",
            "answers",
        ]

    def get_status(self, obj):
        return "answered" if obj.answers.exists() else "pending"
