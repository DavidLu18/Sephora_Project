from rest_framework import generics, permissions
from .models import ProductReview
from .serializers import ProductReviewSerializer

class ProductReviewListCreate(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductReview.objects.filter(product_id=product_id).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ProductReviewLike(generics.UpdateAPIView):
    serializer_class = ProductReviewSerializer
    queryset = ProductReview.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        review = self.get_object()
        review.helpful_count += 1
        review.save()
        return self.update(request, *args, **kwargs)
