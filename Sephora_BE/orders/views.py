from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .models import Orders, OrderItems
from .serializers import OrdersSerializer
from cart.models import Cart, CartItems
from users.models import User  
from django.utils import timezone
from datetime import timedelta

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API cho lịch sử đơn hàng: /api/orders/
    Firebase đã lưu firebase_uid trong bảng users từ khi đăng nhập.
    """
    serializer_class = OrdersSerializer
    permission_classes = [IsAuthenticated]

    def get_userid_from_firebase(self, firebase_uid):
        """Lấy user.id dựa theo firebase_uid"""
        try:
            user = User.objects.get(firebase_uid=firebase_uid)
            return user.userid
        except User.DoesNotExist:
            return None

    def get_queryset(self):
        user_uid = getattr(self.request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng"}, status=404)

        return Orders.objects.filter(userid=user_id).order_by("-createdat")

    def update(self, request, pk=None):
        order = self.get_object()
        data = request.data
        if (
            data.get("status") == "cancelled"
            and order.status in ["pending"]
            and (timezone.now() - order.createdat) < timedelta(hours=24)
        ):
            order.status = "cancelled"
            order.updatedat = timezone.now()
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)

        elif data.get("status") == "returned" and order.status == "delivered":
            order.status = "returned"
            order.updatedat = timezone.now()
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)

        return Response({"detail": "Cannot update order status"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reorder_order(request, order_id):
    """
    Mua lại toàn bộ sản phẩm trong đơn hàng cũ (Firebase Auth + model dùng *id thay vì ForeignKey*).
    """
    # Lấy UID từ FirebaseUser
    user_uid = getattr(request.user, "uid", None)
    if not user_uid:
        return Response({"error": "Không xác định được người dùng."}, status=status.HTTP_401_UNAUTHORIZED)

    # Map Firebase UID → User thực trong DB
    try:
        user = User.objects.get(firebase_uid=user_uid)
    except User.DoesNotExist:
        return Response({"error": "Người dùng chưa được lưu trong hệ thống."}, status=status.HTTP_404_NOT_FOUND)

    # Lấy đơn hàng của user đó
    try:
        order = Orders.objects.get(orderid=order_id, userid=user.userid)
    except Orders.DoesNotExist:
        return Response({"error": "Không tìm thấy đơn hàng."}, status=status.HTTP_404_NOT_FOUND)

    # Lấy hoặc tạo giỏ hàng cho user đó
    cart, created = Cart.objects.get_or_create(userid=user.userid)

    # Lặp qua các sản phẩm trong OrderItems (dùng đúng field orderid)
    added_count = 0
    for item in OrderItems.objects.filter(orderid=order.orderid):
        # Kiểm tra tránh lỗi sản phẩm bị xóa
        if not item.productid:
            continue
        CartItems.objects.create(
            cartid=cart.cartid,
            productid=item.productid,
            quantity=item.quantity,
        )
        added_count += 1

    return Response(
        {"message": f"Đã thêm {added_count} sản phẩm vào giỏ hàng."},
        status=status.HTTP_200_OK,
    )

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """
    API hủy đơn hàng.
    """
    # Lấy UID từ FirebaseUser
    user_uid = getattr(request.user, "uid", None)
    if not user_uid:
        return Response({"error": "Không xác định được người dùng."}, status=status.HTTP_401_UNAUTHORIZED)

    # Map Firebase UID → User thực trong DB
    try:
        user = User.objects.get(firebase_uid=user_uid)
    except User.DoesNotExist:
        return Response({"error": "Người dùng chưa được lưu trong hệ thống."}, status=status.HTTP_404_NOT_FOUND)

    # Lấy đơn hàng của user đó
    try:
        order = Orders.objects.get(orderid=order_id, userid=user.userid)
    except Orders.DoesNotExist:
        return Response({"error": "Đơn hàng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    # Kiểm tra trạng thái đơn hàng có phải 'pending' không
    if order.status != "pending":
        return Response({"error": "Không thể hủy đơn hàng. Đơn hàng không có trạng thái 'pending'."}, status=status.HTTP_400_BAD_REQUEST)

    # Hủy đơn hàng
    order.status = "cancelled"
    order.save()

    return Response({"message": "Đơn hàng đã được hủy."}, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reorder_order(request, order_id):
    """
    Mua lại toàn bộ sản phẩm trong đơn hàng cũ (Firebase Auth + model dùng *id thay vì ForeignKey*).
    """
    # Lấy UID từ FirebaseUser
    user_uid = getattr(request.user, "uid", None)
    if not user_uid:
        return Response({"error": "Không xác định được người dùng."}, status=status.HTTP_401_UNAUTHORIZED)

    # Map Firebase UID → User thực trong DB
    try:
        user = User.objects.get(firebase_uid=user_uid)
    except User.DoesNotExist:
        return Response({"error": "Người dùng chưa được lưu trong hệ thống."}, status=status.HTTP_404_NOT_FOUND)

    # Lấy đơn hàng của user đó
    try:
        order = Orders.objects.get(orderid=order_id, userid=user.userid)
    except Orders.DoesNotExist:
        return Response({"error": "Không tìm thấy đơn hàng."}, status=status.HTTP_404_NOT_FOUND)

    # Lấy hoặc tạo giỏ hàng cho user đó
    cart, created = Cart.objects.get_or_create(userid=user.userid)

    # Lặp qua các sản phẩm trong OrderItems (dùng đúng field orderid)
    added_count = 0
    for item in OrderItems.objects.filter(orderid=order.orderid):
        # Kiểm tra tránh lỗi sản phẩm bị xóa
        if not item.productid:
            continue
        CartItems.objects.create(
            cartid=cart.cartid,
            productid=item.productid,
            quantity=item.quantity,
        )
        added_count += 1

    return Response(
        {"message": f"Đã thêm {added_count} sản phẩm vào giỏ hàng."},
        status=status.HTTP_200_OK,
    )
