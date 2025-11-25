from rest_framework import serializers
from .models import UserPaymentMethod

class UserPaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPaymentMethod
        fields = [
            'id', 'method_type', 'display_name',
            'card_last4', 'card_brand',
            'fake_token', 'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'fake_token', 'created_at']
