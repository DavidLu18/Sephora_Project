from rest_framework.routers import DefaultRouter
from .views import CartViewSet

# Tạo router REST Framework
router = DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')

# Gán router vào urlpatterns
urlpatterns = router.urls
