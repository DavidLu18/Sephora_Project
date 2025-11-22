from rest_framework import serializers
from .models import PromotionCampaign, Voucher

class PromotionCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionCampaign
        fields = [
            "campaign_id",
            "title",
            "description",
            "discount_type",
            "discount_value",
            "min_order",
            "max_discount",
            "start_time",
            "end_time",
            "is_flash_sale",
        ]


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = [
            "voucher_id",
            "code",
            "discount_type",
            "discount_value",
            "min_order",
            "max_discount",
        ]
