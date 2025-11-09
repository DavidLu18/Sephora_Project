# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, reorder_order, cancel_order

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='orders')

urlpatterns = [
    # path('', include(router.urls)),
    path('<int:order_id>/cancel/', cancel_order, name='cancel-order'),
    path('<int:order_id>/reorder/', reorder_order, name='reorder_order'),
]
urlpatterns += router.urls