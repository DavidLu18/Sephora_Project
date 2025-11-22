from rest_framework import serializers
from .models import PromotionCampaign, PromotionProduct, Voucher

class AdminPromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionCampaign
        fields = "__all__"


class AdminPromotionProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionProduct
        fields = "__all__"


class AdminVoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"


