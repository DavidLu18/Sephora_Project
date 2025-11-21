from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from .models import User
from orders.models import Orders
from .admin_serializers import (
    AdminUserListSerializer,
    AdminUserDetailSerializer,
)

# ===========================
#  API: Danh sách khách hàng
# ===========================
@api_view(["GET"])
def admin_list_users(request):
    search = request.GET.get("search", "").strip()

    users = User.objects.all().order_by("-createdat")

    if search:
        users = users.filter(
            Q(email__icontains=search)
            | Q(firstname__icontains=search)
            | Q(lastname__icontains=search)
        )

    serializer = AdminUserListSerializer(users, many=True)
    return Response({"results": serializer.data}, status=200)


# ===========================
#  API: Chi tiết khách hàng
# ===========================
@api_view(["GET"])
def admin_user_detail(request, user_id):
    try:
        user = User.objects.get(userid=user_id)
    except User.DoesNotExist:
        return Response({"message": "Không tìm thấy user"}, status=404)

    serializer = AdminUserDetailSerializer(user)
    return Response(serializer.data, status=200)


# ===========================
#  API: Khóa / mở khóa tài khoản
# ===========================
@api_view(["PATCH"])
def admin_toggle_user(request, user_id):
    try:
        user = User.objects.get(userid=user_id)
    except User.DoesNotExist:
        return Response({"message": "Không tìm thấy user"}, status=404)

    active = request.data.get("active")

    if active is None:
        return Response({"message": "Thiếu active (true/false)"}, status=400)

    user.isactive = active
    user.save()

    return Response({"message": "Cập nhật thành công", "is_active": active})
