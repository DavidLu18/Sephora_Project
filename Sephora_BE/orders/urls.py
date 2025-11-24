# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, reorder_order, cancel_order
from .admin_stats import admin_dashboard_stats
from .admin_views import (
    AdminOrderViewSet,
    admin_bulk_update_orders,
    admin_bulk_delete_orders,
    admin_update_order,
    admin_check_order
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'admin/orders', AdminOrderViewSet, basename='admin-orders')
urlpatterns = [
    # path('', include(router.urls)),
    path('<int:order_id>/cancel/', cancel_order, name='cancel-order'),
    path('<int:order_id>/reorder/', reorder_order, name='reorder_order'),
    path("admin/dashboard-stats/", admin_dashboard_stats),
    path("admin/stats/", admin_dashboard_stats, name="admin_dashboard_stats"),
    path("admin/orders/bulk-update/", admin_bulk_update_orders),
    path("admin/orders/bulk-delete/", admin_bulk_delete_orders),
    # path("admin/orders/<int:id>/", admin_update_order),
    path("admin/orders/check/", admin_check_order),
]
urlpatterns += router.urls