from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, BrandViewSet, CategoryTreeViewSet, chosen_for_you, new_arrivals, products_by_categories, search_products

# Tạo router cho các viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'brands', BrandViewSet, basename='brand')          
router.register(r'categories', CategoryTreeViewSet, basename='category')

urlpatterns = [
    # Các endpoint không sử dụng viewsets
    path('products/chosen-for-you/', chosen_for_you, name='chosen_for_you'),
    path('products/new-arrivals/', new_arrivals, name='new_arrivals'),
    path('products/products-by-categories/', products_by_categories, name='products_by_categories'),  # API mới

    path('products/search/', search_products, name='search_products'),

    # Các URL của các viewset đã đăng ký
    path('', include(router.urls)),
]
