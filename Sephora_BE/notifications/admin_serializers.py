from rest_framework import serializers
from .models import (
    NotificationTemplate,
    ScheduledNotification,
    NotificationGlobal,
    NotificationUser
)

class AdminNotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = "__all__"


class AdminScheduledNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledNotification
        fields = "__all__"


class AdminNotificationGlobalSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationGlobal
        fields = "__all__"


class AdminNotificationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationUser
        fields = "__all__"
