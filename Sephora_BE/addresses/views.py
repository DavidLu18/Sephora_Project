from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Address
from users.models import User
from .serializers import AddressSerializer
from rest_framework.decorators import action

class AddressViewSet(viewsets.ViewSet):

    def get_userid_from_firebase(self, firebase_uid):
        try:
            user = User.objects.get(firebase_uid=firebase_uid)
            return user.userid
        except User.DoesNotExist:
            return None

    # GET /api/address/
    def list(self, request):
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng"}, status=404)

        addresses = Address.objects.filter(userid=user_id).order_by("-isdefault", "-createdat")
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data)

    # POST /api/address/
    def create(self, request):
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng"}, status=404)

        # Lấy User instance
        user = User.objects.get(userid=user_id)

        data = request.data.copy()

        # Nếu là default → bỏ default cũ
        if data.get("isdefault"):
            Address.objects.filter(userid=user, isdefault=True).update(isdefault=False)

        serializer = AddressSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(userid=user)  # <-- FIX QUAN TRỌNG

        return Response(serializer.data, status=201)
    # DELETE /api/address/<id>/
    def destroy(self, request, pk=None):
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng"}, status=404)

        address = Address.objects.filter(addressid=pk, userid=user_id).first()
        if not address:
            return Response({"error": "Không tìm thấy địa chỉ"}, status=404)

        address.delete()
        return Response({"message": "Đã xóa địa chỉ"}, status=200)

    @action(detail=True, methods=["patch"], url_path="set-default")
    def set_default(self, request, pk=None):
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        try:
            user = User.objects.get(firebase_uid=user_uid)
        except User.DoesNotExist:
            return Response({"error": "Không tìm thấy người dùng"}, status=404)

        address = Address.objects.filter(addressid=pk, userid=user).first()
        if not address:
            return Response({"error": "Không tìm thấy địa chỉ"}, status=404)

        Address.objects.filter(userid=user).update(isdefault=False)
        address.isdefault = True
        address.save()

        return Response({"message": "Đặt địa chỉ mặc định thành công"}, status=200)
