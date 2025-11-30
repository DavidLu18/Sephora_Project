# wishlists/urls.py
from rest_framework.routers import DefaultRouter
from .views import WishListViewSet

router = DefaultRouter()
router.register(r"wishlists", WishListViewSet, basename="wishlists")

urlpatterns = router.urls
