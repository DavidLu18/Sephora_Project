from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import WishList, WishListItem
from .serializers import (
    WishListSerializer,
    WishListCreateSerializer,
    AddItemSerializer,
    MoveItemSerializer,
)
from products.models import Product
from users.models import User


class WishListViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    #  Helper: lấy User thật trong DB từ FirebaseUser
    def get_current_user(self):
        firebase_user = self.request.user  # <FirebaseUser>
        user_uid = getattr(firebase_user, "uid", None)
        if not user_uid:
            return None

        #  Nếu User model của bạn dùng field khác (vd firebase_uid)
        # thì sửa lại cho đúng:
        user = User.objects.filter(firebase_uid=user_uid).first()
        return user

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            # Không có user -> trả về rỗng, tránh lỗi 500
            return WishList.objects.none()
        return WishList.objects.filter(user=user).order_by(
            "-is_default", "created_at"
        )

    def get_serializer_class(self):
        if self.action == "create":
            return WishListCreateSerializer
        return WishListSerializer

    def perform_destroy(self, instance):
        if instance.is_default:
            # Không cho xóa list mặc định
            raise ValueError("Không thể xoá danh sách yêu thích mặc định.")
        super().perform_destroy(instance)

    # ========= ITEMS TRONG 1 WISHLIST =========

    @action(detail=True, methods=["get"], url_path="items")
    def items(self, request, pk=None):
        wishlist = self.get_object()
        items = wishlist.items.select_related("product")
        from .serializers import WishListItemSerializer

        serializer = WishListItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="add-item")
    def add_item(self, request, pk=None):
        wishlist = self.get_object()
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data["product_id"]

        try:
            product = Product.objects.get(productid=product_id)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Sản phẩm không tồn tại."},
                status=status.HTTP_404_NOT_FOUND,
            )

        item, created = WishListItem.objects.get_or_create(
            wishlist=wishlist,
            product=product,
        )

        if not created:
            return Response(
                {"detail": "Sản phẩm đã tồn tại trong danh sách này."},
                status=status.HTTP_200_OK,
            )

        return Response({"detail": "Đã thêm vào danh sách yêu thích."}, status=201)

    @action(detail=True, methods=["post"], url_path="remove-item")
    def remove_item(self, request, pk=None):
        wishlist = self.get_object()
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data["product_id"]

        deleted, _ = WishListItem.objects.filter(
            wishlist=wishlist, product_id=product_id
        ).delete()

        if deleted == 0:
            return Response(
                {"detail": "Sản phẩm không nằm trong danh sách này."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({"detail": "Đã xoá khỏi danh sách."}, status=200)

    # ========= TOGGLE HEART TRONG WISHLIST DEFAULT =========

    @action(detail=False, methods=["post"], url_path="toggle-heart")
    def toggle_heart(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]

        user = self.get_current_user()
        if not user:
            return Response(
                {"detail": "Bạn chưa đăng nhập."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            product = Product.objects.get(productid=product_id)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Sản phẩm không tồn tại."},
                status=status.HTTP_404_NOT_FOUND,
            )

        default_wishlist = WishList.objects.filter(
            user=user, is_default=True
        ).first()

        if not default_wishlist:
            default_wishlist = WishList.objects.create(
                user=user,
                name="Yêu thích",
                is_default=True,
            )

        item = WishListItem.objects.filter(
            wishlist=default_wishlist,
            product=product,
        ).first()

        if item:
            item.delete()
            return Response({"liked": False, "detail": "Đã bỏ yêu thích."})
        else:
            WishListItem.objects.create(
                wishlist=default_wishlist,
                product=product,
            )
            return Response({"liked": True, "detail": "Đã thêm vào yêu thích."})

    # ========= MOVE ITEM GIỮA CÁC LIST =========

    @action(detail=False, methods=["post"], url_path="move-item")
    def move_item(self, request):
        serializer = MoveItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_current_user()
        if not user:
            return Response(
                {"detail": "Bạn chưa đăng nhập."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        from_id = serializer.validated_data["from_wishlist_id"]
        to_id = serializer.validated_data["to_wishlist_id"]
        product_id = serializer.validated_data["product_id"]

        try:
            from_wishlist = WishList.objects.get(
                wishlistid=from_id, user=user
            )
            to_wishlist = WishList.objects.get(
                wishlistid=to_id, user=user
            )
        except WishList.DoesNotExist:
            return Response(
                {"detail": "Danh sách không hợp lệ."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            product = Product.objects.get(productid=product_id)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Sản phẩm không tồn tại."},
                status=status.HTTP_404_NOT_FOUND,
            )

        WishListItem.objects.filter(
            wishlist=from_wishlist,
            product=product,
        ).delete()

        WishListItem.objects.get_or_create(
            wishlist=to_wishlist,
            product=product,
        )

        return Response({"detail": "Đã chuyển sản phẩm sang danh sách mới."})
