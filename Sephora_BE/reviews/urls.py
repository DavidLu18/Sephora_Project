from django.urls import path
from .views import ProductReviewListCreate, ProductReviewLike, ProductReviewDetail
from .admin_views import AdminReviewList, AdminReviewDetail, AdminReviewDelete

urlpatterns = [
    path('products/<int:product_id>/reviews/', ProductReviewListCreate.as_view(), name='review-list-create'),
    path('reviews/<int:pk>/like/', ProductReviewLike.as_view(), name='review-like'),
    path("reviews/<int:pk>/", ProductReviewDetail.as_view(), name="review-detail"),
    path('admin/reviews/', AdminReviewList.as_view(), name='admin-review-list'),
    path('admin/reviews/<int:pk>/', AdminReviewDetail.as_view(), name='admin-review-detail'),
    path('admin/reviews/<int:pk>/delete/', AdminReviewDelete.as_view()),


]
