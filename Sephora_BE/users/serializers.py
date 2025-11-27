from rest_framework import serializers
from .models import User, UserRole


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = "__all__"

    def get_role(self, obj: User) -> str:
        if hasattr(obj, "role_entry") and obj.role_entry:
            return obj.role_entry.role
        try:
            return obj.role_entry.role  # type: ignore[attr-defined]
        except Exception:
            pass
        try:
            role = UserRole.objects.get(user=obj)
            return role.role
        except UserRole.DoesNotExist:
            return "customer"
