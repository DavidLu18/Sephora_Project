from rest_framework import serializers
from .models import NotificationGlobal, NotificationUser


class NotificationGlobalSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationGlobal
        fields = "__all__"


class NotificationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationUser
        fields = "__all__"
