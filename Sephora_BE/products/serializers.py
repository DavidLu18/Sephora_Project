from rest_framework import serializers
from .models import Product, Brand, Category
from ast import literal_eval

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'


class RecursiveCategorySerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = CategorySerializer(value, context=self.context)
        return serializer.data


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        allow_null=True,
        required=False
    )
    children = RecursiveCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'parent', 'children']

    def get_parent(self, obj):
        """Trả về thông tin category cha (nếu có)."""
        if obj.parent:
            return {
                "category_id": obj.parent.category_id,
                "category_name": obj.parent.category_name,
                "parent": self.get_parent(obj.parent)
            }
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'children' not in data or data['children'] is None:
            data['children'] = []
        return data



class ProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.brand_name', read_only=True)
    highlight = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    category = CategorySerializer(read_only=True)
    brand_id = serializers.IntegerField( read_only=True)
    category_id = serializers.IntegerField( read_only=True)
    # thêm:
    images = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "productid",
            "sku",
            "product_name",

            "brand_name",     
            "brand_id",

            "category",
            "category_id",

            "price",
            "sale_price",
            "value_price",
            "currency",
            "size",

            "highlight",
            "description",
            "ingredients",
            "skin_types",

            "is_exclusive",
            "online_only",
            "out_of_stock",
            "is_limited_edition",
            "is_new",

            "stock",

            "avg_rating",
            "reviews_count",

            "images",
            "thumbnail",
        ]

    # --- highlight ---
    def get_highlight(self, obj):
        if not obj.highlight:
            return []
        try:
            return literal_eval(obj.highlight)
        except Exception:
            return []

    # --- avg rating ---
    def get_avg_rating(self, obj):
        if hasattr(obj, "calculated_avg_rating") and obj.calculated_avg_rating is not None:
            return round(float(obj.calculated_avg_rating), 2)

        return float(obj.avg_rating) if obj.avg_rating is not None else 0.0

    # --- List ảnh ---
    def get_images(self, obj):
        return [img.image_url for img in obj.images.all()]

    # --- Thumbnail (ảnh đầu tiên hoặc default) ---
    def get_thumbnail(self, obj):
        first = obj.images.first()
        default_url = "/media/products/default.jpg"

        # Nếu có ảnh → trả ảnh đầu tiên
        if first:
            return first.image_url

        # Nếu không có request (nằm trong API list) → trả URL tương đối
        request = self.context.get("request")
        if not request:
            return default_url

        # Nếu có request → trả absolute URL
        return request.build_absolute_uri(default_url)

