# wishlists/serializers.py
from rest_framework import serializers
from .models import WishList, WishListItem
from products.serializers import ProductSerializer


class WishListItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = WishListItem
        fields = ["id", "product"]   # ❗ KHÔNG có created_at


class WishListSerializer(serializers.ModelSerializer):
    items = WishListItemSerializer(many=True, read_only=True)

    class Meta:
        model = WishList
        fields = ["wishlistid", "name", "is_default", "created_at", "items"]
        read_only_fields = ["wishlistid", "is_default", "created_at", "items"]


class WishListCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishList
        fields = ["name"]

    def create(self, validated_data):
        request = self.context["request"]
        firebase_user = request.user
        user_uid = getattr(firebase_user, "uid", None)

        from users.models import User

        user = User.objects.filter(firebase_uid=user_uid).first()

        return WishList.objects.create(
            user=user,
            is_default=False,
            **validated_data
        )


class AddItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()


class MoveItemSerializer(serializers.Serializer):
    from_wishlist_id = serializers.IntegerField()
    to_wishlist_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
