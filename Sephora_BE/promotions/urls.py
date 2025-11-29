from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import FlashSaleAPIView, ApplyVoucherAPIView, AvailableVouchersView
from .admin_views import (
    PromotionAdminViewSet,
    VoucherAdminViewSet,
    PromotionProductAdminViewSet
)

router = DefaultRouter()
router.register("admin/campaigns", PromotionAdminViewSet, basename="admin-campaigns")
router.register("admin/vouchers", VoucherAdminViewSet, basename="admin-vouchers")
router.register("admin/campaign-products", PromotionProductAdminViewSet, basename="admin-promotion-products")

urlpatterns = [

    path("flash-sale/", FlashSaleAPIView.as_view()),
    path("apply-voucher/", ApplyVoucherAPIView.as_view()),
    path("available-vouchers/", AvailableVouchersView.as_view(), name="available-vouchers"),
    path("", include(router.urls)),
]
