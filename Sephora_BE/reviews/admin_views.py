from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import ProductReview
from .admin_serializers import AdminProductReviewSerializer
from .pagination import AdminReviewPagination

# === GET LIST REVIEW (KHÔNG STATUS, KHÔNG DUYỆT) ===
class AdminReviewList(ListAPIView):
    serializer_class = AdminProductReviewSerializer
    pagination_class = AdminReviewPagination
    def get_queryset(self):
        qs = ProductReview.objects.select_related("product").all().order_by("-reviewid")

        # filter theo productid hoặc sku
        search = self.request.query_params.get("search")
        rating = self.request.query_params.get("rating")

        if search:
            qs = qs.filter(
                Q(product__productid__icontains=search) |
                Q(product__sku__icontains=search)
            )

        if rating:
            qs = qs.filter(rating=rating)

        return qs


# === GET DETAIL ===
class AdminReviewDetail(RetrieveAPIView):
    queryset = ProductReview.objects.select_related("product")
    serializer_class = AdminProductReviewSerializer


# === DELETE REVIEW ===
class AdminReviewDelete(APIView):
    def delete(self, request, pk):
        try:
            obj = ProductReview.objects.get(reviewid=pk)
            obj.delete()
            return Response({"message": "Review deleted"})
        except ProductReview.DoesNotExist:
            return Response({"error": "Not Found"}, status=404)
