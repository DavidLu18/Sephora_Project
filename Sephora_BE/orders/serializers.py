# orders/serializers.py
from rest_framework import serializers
from .models import Orders, OrderItems

class OrderItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItems
        fields = ['orderitemid', 'orderid', 'productid', 'quantity', 'price']

class OrdersSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()  # 👈 thay vì many=True

    class Meta:
        model = Orders
        fields = [
            'orderid', 'userid', 'addressid', 'total', 'status',
            'payment_method', 'shipping_method', 'createdat', 'updatedat', 'items'
        ]

    def get_items(self, obj):
        """Trả về danh sách sản phẩm thuộc đơn hàng"""
        items = OrderItems.objects.filter(orderid=obj.orderid)
        return OrderItemsSerializer(items, many=True).data