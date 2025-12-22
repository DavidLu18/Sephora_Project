from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import ProductQuestion, ProductAnswer, QuestionHelpful
from .serializers import ProductQuestionSerializer, ProductAnswerSerializer
from products.models import Product


# =========================
#  Danh sách + Tạo câu hỏi
# =========================
class ProductQuestionListCreate(generics.ListCreateAPIView):
    serializer_class = ProductQuestionSerializer
    permission_classes = [permissions.AllowAny]  #  Ai cũng có thể hỏi

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductQuestion.objects.filter(product_id=product_id, is_public=True)

    def post(self, request, *args, **kwargs):
        product = get_object_or_404(Product, pk=kwargs['product_id'])
        serializer = ProductQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ✅ Không có user nữa — chỉ lưu nội dung
        question = ProductQuestion.objects.create(
            product=product,
            content=serializer.validated_data['content']
        )

        return Response(ProductQuestionSerializer(question).data, status=201)


# =========================
#  Danh sách + Tạo câu trả lời
# =========================
class ProductAnswerListCreate(generics.ListCreateAPIView):
    serializer_class = ProductAnswerSerializer
    permission_classes = [permissions.AllowAny]  #  Ai cũng có thể trả lời

    def get_queryset(self):
        return ProductAnswer.objects.filter(question_id=self.kwargs['question_id'])

    def post(self, request, *args, **kwargs):
        question = get_object_or_404(ProductQuestion, pk=kwargs['question_id'])
        serializer = ProductAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ✅ Không có user — chỉ lưu nội dung
        answer = ProductAnswer.objects.create(
            question=question,
            content=serializer.validated_data['content']
        )

        return Response(ProductAnswerSerializer(answer).data, status=201)


# =========================
#  Toggle “Hữu ích” (ẩn danh)
# =========================
class QuestionHelpfulToggle(APIView):
    permission_classes = [permissions.AllowAny]  #  Ai cũng có thể bấm “Hữu ích”

    def post(self, request, question_id):
        q = get_object_or_404(ProductQuestion, pk=question_id)

        # ✅ Lấy IP của người vote ẩn danh
        ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')

        try:
            # Nếu chưa tồn tại record IP + question → thêm mới
            QuestionHelpful.objects.create(question=q, ip_address=ip_address)
            q.helpful_count = q.helpful_count + 1
            q.save(update_fields=['helpful_count'])
        except IntegrityError:
            # Đã vote rồi (do unique_together) → không cộng thêm
            pass

        return Response({'helpful_count': q.helpful_count})
