from rest_framework import serializers
from .models import Cart, CartItems
from products.serializers import ProductSerializer
from products.models import Product


class CartItemSerializer(serializers.ModelSerializer):
    # Hiển thị thông tin sản phẩm (optional, nếu bạn muốn load product)
    product = serializers.SerializerMethodField()

    class Meta:
        model = CartItems
        fields = ["cartitemid", "cartid", "productid", "product", "quantity", "addedat"]

    def get_product(self, obj):
        try:
            product = Product.objects.get(productid=obj.productid)
            return ProductSerializer(product).data
        except Product.DoesNotExist:
            return None


class CartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["cartid", "userid", "createdat", "items"]

    def get_items(self, obj):
        # Vì không có ForeignKey, ta lọc thủ công theo cartid
        cart_items = CartItems.objects.filter(cartid=obj.cartid)
        return CartItemSerializer(cart_items, many=True).data
