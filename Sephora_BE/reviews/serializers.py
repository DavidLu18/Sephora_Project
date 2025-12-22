from rest_framework import serializers
from .models import ProductReview, ReviewImage
from users.models import User

class ReviewImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ReviewImage
        fields = ["image"]

    def get_image(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    helpful_count = serializers.SerializerMethodField()  #   hiển thị như FE mong muốn
    created_at = serializers.DateTimeField(
        source='submission_time',  #   lấy giá trị trực tiếp từ cột DB
        read_only=True,
        format="%Y-%m-%dT%H:%M:%S.%fZ"  #   chuẩn ISO để JS hiểu
    )
    images = ReviewImageSerializer(many=True, read_only=True)

    # legacy (chuỗi) – CHỈ đọc, không ghi
    review_images = serializers.CharField(read_only=True)
    review_videos = serializers.CharField(read_only=True)
    class Meta:
        model = ProductReview
        fields = [
            "reviewid",
            "product",
            "userid",
            "user_name",
            "user_email",
            "rating",
            "is_recommended",
            "review_text",
            # ảnh mới
            "images",

            # ảnh cũ
            "review_images",
            "review_videos",
            
            "review_title",
            "review_images",
            "review_videos",
            "helpfulness",
            "total_feedback_count",
            "total_pos_feedback_count",
            "total_neg_feedback_count",
            "helpful_count",
            "created_at",
        ]
        read_only_fields = ["userid", "product", "created_at"]

    def get_user_name(self, obj):
        try:
            user = User.objects.get(userid=obj.userid)
            # Nếu có first_name hoặc email thì ưu tiên hiển thị
            return getattr(user, "first_name", None) or getattr(user, "email", None) or "Người dùng"
        except User.DoesNotExist:
            return "Người dùng"

    def get_user_email(self, obj):
        try:
            user = User.objects.get(userid=obj.userid)
            return getattr(user, "email", None)
        except User.DoesNotExist:
            return None

    # Trả ra “helpful_count” cho FE = tổng feedback tích cực (nếu có)
    def get_helpful_count(self, obj):
        if obj.total_pos_feedback_count is not None:
            return obj.total_pos_feedback_count
        return 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["review_images"] = (
            instance.review_images.split(",") if instance.review_images else []
        )
        return data
    
