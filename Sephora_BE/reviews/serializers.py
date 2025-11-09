from rest_framework import serializers
from .models import ProductReview

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ProductReview
        fields = '__all__'
        read_only_fields = ['user', 'helpful_count', 'created_at']
