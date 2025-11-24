from rest_framework import serializers
from .models import Orders, OrderItems
from products.models import Product
from users.models import User

class AdminOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItems
        fields = ["orderitemid", "productid", "product_name", "quantity", "price", "image"]

    def get_product_name(self, obj):
        from products.models import Product
        product = Product.objects.filter(productid=obj.productid).first()
        return product.product_name if product else None

    def get_image(self, obj):
        # Không có ảnh trong Product -> return None hoặc return ảnh mặc định
        return None
        # hoặc:
        # return "https://via.placeholder.com/150?text=No+Image"



class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Orders
        fields = [
            "orderid",
            "userid",
            "user_email",
            "addressid",
            "total",
            "status",
            "payment_method",
            "shipping_method",
            "createdat",
            "updatedat",
            "items",
        ]

    def get_user_email(self, obj):
        user = User.objects.filter(userid=obj.userid).first()
        return user.email if user else None

    def get_items(self, obj):
        qs = OrderItems.objects.filter(orderid=obj.orderid)
        return AdminOrderItemSerializer(qs, many=True).data
