from rest_framework import serializers
from .models import ProductReview
from users.models import User


class AdminProductReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.product_name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_id = serializers.IntegerField(source="product.productid", read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(
        source='submission_time',
        read_only=True,
        format="%Y-%m-%dT%H:%M:%S.%fZ"
    )
    class Meta:
        model = ProductReview
        fields = [
            "reviewid",
            "product",
            "product_name",
            "product_sku",
            "product_id",  
            "userid",
            "user_name",
            "user_email",
            "rating",
            "is_recommended",
            "review_text",
            "review_title",
            "review_images",
            "review_videos",
            "helpfulness",
            "total_feedback_count",
            "total_pos_feedback_count",
            "total_neg_feedback_count",
            "created_at",
        ]
        read_only_fields = ["userid", "product", "created_at"]

    def get_user_name(self, obj):
        try:
            user = User.objects.get(userid=obj.userid)
            return getattr(user, "email", None) or f"User #{obj.userid}"
        except User.DoesNotExist:
            return f"User #{obj.userid}"

    def get_user_email(self, obj):
        try:
            user = User.objects.get(userid=obj.userid)
            return user.email
        except User.DoesNotExist:
            return None

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Convert CSV -> List cho FE
        data["review_images"] = (
            instance.review_images.split(",") if instance.review_images else []
        )

        data["review_videos"] = (
            instance.review_videos.split(",") if instance.review_videos else []
        )

        return data
