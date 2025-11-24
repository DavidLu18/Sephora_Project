from rest_framework import serializers
from .models import Orders, OrderItems
from products.models import Product
from reviews.models import ProductReview 
from users.models import User

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()
    class Meta:
        model = OrderItems
        fields = [
            'orderitemid',
            'orderid',
            'productid',
            'quantity',
            'price',
            'product_name',
            'brand_name',
            'category_name',
            'product_image',
            'user_review'
        ]

    def get_user_review(self, obj):
        request = self.context.get("request")
        firebase_user = getattr(request, "user", None)

        if not firebase_user or not getattr(firebase_user, "uid", None):
            return None

        from users.models import User
        user = User.objects.filter(firebase_uid=firebase_user.uid).first()
        if not user:
            return None

        from reviews.models import ProductReview
        review = ProductReview.objects.filter(product_id=obj.productid, userid=user.userid).first()
        print("DEBUG >>> review found:", review)

        if not review:
            return None

        # ✅ Xử lý ảnh review an toàn (tránh lỗi .all)
        images = []
        if hasattr(review, "review_images"):
            field_value = review.review_images
            # Nếu là quan hệ related_name
            if hasattr(field_value, "all"):
                images = [ri.image.url for ri in field_value.all()]
            # Nếu là chuỗi JSON hoặc text
            elif isinstance(field_value, str) and field_value.strip():
                try:
                    import json
                    parsed = json.loads(field_value)
                    images = parsed if isinstance(parsed, list) else [parsed]
                except Exception:
                    images = [field_value]
            # Nếu là None hoặc rỗng → để images = []

        return {
            "rating": review.rating,
            "reviewid": review.reviewid,
            "review_title": review.review_title,
            "review_text": review.review_text,
            "review_images": images,  # luôn là list an toàn
        }
    
    def get_product(self, obj):
        """Lấy product tương ứng theo productid"""
        if not obj.productid:
            return None
        return Product.objects.filter(productid=obj.productid).select_related('brand', 'category').first()

    def get_product_name(self, obj):
        product = self.get_product(obj)
        return product.product_name if product else None

    def get_brand_name(self, obj):
        product = self.get_product(obj)
        if product and product.brand:
            return getattr(product.brand, "brand_name", None)
        return None

    def get_category_name(self, obj):
        product = self.get_product(obj)
        if product and product.category:
            return getattr(product.category, "category_name", None)
        return None

    def get_product_image(self, obj):
        product = self.get_product(obj)
        if product and hasattr(product, "product_image") and product.product_image:
            return product.product_image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Orders
        fields = [
            'orderid',
            'userid',
            'addressid',
            'total',
            'status',
            'payment_method',
            'shipping_method',
            'createdat',
            'updatedat',
            'items',
        ]

    def get_items(self, obj):
        order_items = OrderItems.objects.filter(orderid=obj.orderid)
        return OrderItemSerializer(order_items, many=True, context=self.context).data
