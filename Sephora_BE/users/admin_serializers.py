from rest_framework import serializers
from .models import User
from orders.models import Orders   # đúng model


class AdminUserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "userid",
            "full_name",
            "email",
            "phone",
            "isactive",
            "createdat",
            "total_orders",
            "total_spent",
        ]

    def get_full_name(self, obj):
        return f"{obj.firstname} {obj.lastname}".strip()

    def get_total_orders(self, obj):
        return Orders.objects.filter(userid=obj.userid).count()

    def get_total_spent(self, obj):
        orders = Orders.objects.filter(userid=obj.userid)
        return sum(o.total for o in orders)


class AdminUserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    order_history = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = "__all__"

    def get_full_name(self, obj):
        return f"{obj.firstname} {obj.lastname}".strip()

    def get_order_history(self, obj):
        orders = Orders.objects.filter(userid=obj.userid).order_by("-createdat")
        return [
            {
                "order_id": o.orderid,
                "total": o.total,
                "status": o.status,
                "payment_method": o.payment_method,
                "created_at": o.createdat,
            }
            for o in orders
        ]
