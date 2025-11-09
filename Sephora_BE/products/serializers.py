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
    parent = serializers.SerializerMethodField()  
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
    avg_rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    category = CategorySerializer(read_only=True)
    class Meta:
        model = Product
        fields = [
           'productid', 'sku', 'product_name', 'brand_name',
            'price', 'sale_price', 'currency', 'size', 'description',
            'avg_rating', 'reviews_count', 'category', 'highlight',
        ]
    def get_highlight(self, obj):
        if not obj.highlight:
            return []
        try:
            return literal_eval(obj.highlight)
        except Exception:
            return []