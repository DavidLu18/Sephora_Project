from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProductQuestion
from .admin_serializers import AdminProductQuestionSerializer

from django.db.models import Q

class AdminQuestionList(ListAPIView):
    serializer_class = AdminProductQuestionSerializer

    def get_queryset(self):
        qs = (
            ProductQuestion.objects
            .select_related("product")
            .all()
            .order_by("-created_at")
        )

        search = self.request.query_params.get("search")   # tìm theo id hoặc sku
        answered = self.request.query_params.get("answered")

        # 🔍 Tìm theo productid hoặc sku
        if search:
            qs = qs.filter(
                Q(product__productid__icontains=search) |
                Q(product__sku__icontains=search)
            )

        # 📌 Lọc theo trạng thái trả lời
        if answered == "true":
            qs = qs.exclude(answers__isnull=True)    # đã trả lời
        elif answered == "false":
            qs = qs.filter(answers__isnull=True)     # chưa trả lời

        return qs



class AdminQuestionAnswer(UpdateAPIView):
    queryset = ProductQuestion.objects.all()

    def update(self, request, *args, **kwargs):
        question = self.get_object()
        content = request.data.get("answer")

        if not content:
            return Response({"error": "Answer is required"}, status=400)

        ProductAnswer.objects.create(
            question=question,
            content=content,
            answered_by=request.user,
        )
        return Response({"message": "Answer added"})

class AdminQuestionDelete(APIView):
    def delete(self, request, pk):
        from .models import ProductQuestion
        try:
            q = ProductQuestion.objects.get(pk=pk)
            q.delete()
            return Response({"message": "Question deleted"})
        except ProductQuestion.DoesNotExist:
            return Response({"error": "Not found"}, status=404)