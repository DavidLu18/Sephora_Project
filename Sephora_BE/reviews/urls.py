from django.urls import path
from .views import ProductReviewListCreate, ProductReviewLike

urlpatterns = [
    path('products/<int:product_id>/reviews/', ProductReviewListCreate.as_view(), name='review-list-create'),
    path('reviews/<int:pk>/like/', ProductReviewLike.as_view(), name='review-like'),
]
