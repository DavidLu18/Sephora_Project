from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from notifications.models import NotificationGlobal, NotificationUser
from notifications.serializers import (
    NotificationGlobalSerializer,
    NotificationUserSerializer,
)


class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Thông báo global (dùng chung)
        global_notis = NotificationGlobal.objects.all().order_by("-created_at")

        # Thông báo cá nhân
        user_notis = NotificationUser.objects.filter(user=user).order_by("-created_at")

        return Response({
            "global": NotificationGlobalSerializer(global_notis, many=True).data,
            "user": NotificationUserSerializer(user_notis, many=True).data
        })


class NotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, noti_id):
        user = request.user

        try:
            noti = NotificationUser.objects.get(id=noti_id, user=user)
        except NotificationUser.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        noti.is_read = True
        noti.save()

        return Response({"success": True})
