from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny

from .models import (
    PromotionCampaign,
    Voucher,
    PromotionProduct,
    CampaignCategory,
    CampaignBrand,
    PromotionProduct      # nếu khác tên, dùng model bạn tạo
)
from .admin_serializers import (
    AdminPromotionSerializer,
    AdminVoucherSerializer,
    AdminPromotionProductSerializer
)
from notifications.services import send_global_notification

class PromotionAdminViewSet(ModelViewSet):
    queryset = PromotionCampaign.objects.all().order_by("-campaign_id")
    serializer_class = AdminPromotionSerializer
    permission_classes = [AllowAny]  # ⬅ BỎ XÁC THỰC

    def perform_create(self, serializer):
        campaign = serializer.save()

        scope = self.request.data.get("apply_scope")
        
        if scope == "product":
            product_ids = self.request.data.get("product_ids", [])
            for pid in product_ids:
                PromotionProduct.objects.create(campaign=campaign, product_id=pid)

        if scope == "category":
            category_ids = self.request.data.get("category_ids", [])
            for cid in category_ids:
                CampaignCategory.objects.create(campaign=campaign, category_id=cid)

        if scope == "brand":
            brand_ids = self.request.data.get("brand_ids", [])
            for bid in brand_ids:
                CampaignBrand.objects.create(campaign=campaign, brand_id=bid)


class VoucherAdminViewSet(ModelViewSet):
    queryset = Voucher.objects.all().order_by("-voucher_id")
    serializer_class = AdminVoucherSerializer
    permission_classes = [AllowAny]  # ⬅ BỎ XÁC THỰC

    def perform_create(self, serializer):
        voucher = serializer.save()

        send_global_notification(
            title="Voucher mới!",
            message=f"Voucher {voucher.code} đã được kích hoạt!",
            noti_type="promotion"
        )
class PromotionProductAdminViewSet(ModelViewSet):
    queryset = PromotionProduct.objects.all()
    serializer_class = AdminPromotionProductSerializer
    permission_classes = [AllowAny]  # ⬅ BỎ XÁC THỰC
