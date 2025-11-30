from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import User
from notifications.models import NotificationGlobal, NotificationUser
from notifications.serializers import (
    NotificationGlobalSerializer,
    NotificationUserSerializer,
)


class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user is FirebaseUser
        firebase_uid = getattr(request.user, "uid", None)
        if not firebase_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user = User.objects.filter(firebase_uid=firebase_uid).first()
        if not user:
            return Response({"error": "User không tồn tại"}, status=404)

        global_notis = NotificationGlobal.objects.all().order_by("-created_at")
        user_notis = NotificationUser.objects.filter(user_id=user.userid).order_by("-created_at")

        return Response({
            "global": NotificationGlobalSerializer(global_notis, many=True).data,
            "user": NotificationUserSerializer(user_notis, many=True).data
        })


class NotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, noti_id):
        firebase_uid = getattr(request.user, "uid", None)
        if not firebase_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user = User.objects.filter(firebase_uid=firebase_uid).first()
        if not user:
            return Response({"error": "User không tồn tại"}, status=404)

        try:
            noti = NotificationUser.objects.get(id=noti_id, user_id=user.userid)
        except NotificationUser.DoesNotExist:
            return Response({"error": "Không tìm thấy thông báo"}, status=404)

        noti.is_read = True
        noti.save()

        return Response({"success": True})
