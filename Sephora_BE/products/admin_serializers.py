from rest_framework import serializers
from .models import Product, ProductImage
from django.utils import timezone
class AdminProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "productid",

            "product_name",
            "sku",

            "brand",        
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
            "review_count",

            "created_at",
            "updated_at",
        ]

    def validate_sku(self, value):
        product_id = self.instance.productid if self.instance else None

        if Product.objects.filter(sku=value).exclude(productid=product_id).exists():
            raise serializers.ValidationError("SKU đã tồn tại.")
        return value
    
    def update(self, instance, validated_data):
        brand_id = validated_data.pop("brand_id", None)
        category_id = validated_data.pop("category_id", None)
        validated_data["updated_at"] = timezone.now()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if brand_id:
            instance.brand_id = brand_id
        if category_id:
            instance.category_id = category_id

        instance.save()
        return instance

    def create(self, validated_data):
        brand_id = validated_data.pop("brand_id", None)
        category_id = validated_data.pop("category_id", None)
        validated_data["created_at"] = timezone.now()
        validated_data["updated_at"] = timezone.now()
        product = Product.objects.create(**validated_data)

        if brand_id:
            product.brand_id = brand_id
        if category_id:
            product.category_id = category_id

        product.save()
        return product



class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["image_id", "product", "image_url", "alt_text"]
