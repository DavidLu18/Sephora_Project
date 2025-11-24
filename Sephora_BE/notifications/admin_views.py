from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny

from .models import (
    NotificationTemplate,
    ScheduledNotification,
    NotificationGlobal,
    NotificationUser
)

from .admin_serializers import (
    AdminNotificationTemplateSerializer,
    AdminScheduledNotificationSerializer,
    AdminNotificationGlobalSerializer,
    AdminNotificationUserSerializer
)


class NotificationTemplateAdminViewSet(ModelViewSet):
    queryset = NotificationTemplate.objects.all().order_by("-template_id")
    serializer_class = AdminNotificationTemplateSerializer
    permission_classes = [AllowAny]


class ScheduledNotificationAdminViewSet(ModelViewSet):
    queryset = ScheduledNotification.objects.all().order_by("-schedule_id")
    serializer_class = AdminScheduledNotificationSerializer
    permission_classes = [AllowAny]


class NotificationGlobalAdminViewSet(ModelViewSet):
    queryset = NotificationGlobal.objects.all().order_by("-global_id")
    serializer_class = AdminNotificationGlobalSerializer
    permission_classes = [AllowAny]


class NotificationUserAdminViewSet(ModelViewSet):
    queryset = NotificationUser.objects.all().order_by("-id")
    serializer_class = AdminNotificationUserSerializer
    permission_classes = [AllowAny]
