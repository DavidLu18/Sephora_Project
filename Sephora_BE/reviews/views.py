from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import ProductReview
from .serializers import ProductReviewSerializer
from orders.models import Orders, OrderItems
from users.models import User 
from products.models import Product
from django.db import connection
from django.contrib.auth import get_user_model
from django.db.models.expressions import RawSQL
UserModel = get_user_model()

class ProductReviewListCreate(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductReview.objects.filter(product_id=product_id).annotate(
            submission_time=RawSQL('submission_time', [])
        ).order_by('-submission_time')
    def create(self, request, *args, **kwargs):
        print("Dữ liệu nhận được:", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Lỗi serializer:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Tạo review mới (chỉ cho phép khi user đã mua sản phẩm)"""
        firebase_user = getattr(self.request, "user", None)
        #   Kiểm tra user Firebase
        if not firebase_user or not getattr(firebase_user, "uid", None):
            raise PermissionError("Unauthorized")
        try:
            user = User.objects.get(firebase_uid=firebase_user.uid)
        except UserModel.DoesNotExist:
            raise PermissionError("Không tìm thấy người dùng trong hệ thống. Vui lòng đăng nhập lại.")

        product_id = self.kwargs.get("product_id")
        print("product_id:", product_id)
        if not product_id:
            raise ValueError("Thiếu product_id trong URL")

        #   Bắt buộc phải có rating
        rating = self.request.data.get("rating")
        print("  rating:", rating)
        if not rating:
            raise ValueError("Bạn phải chọn số sao để đánh giá sản phẩm!")

        #   Review text có thể để trống
        review_text = self.request.data.get("review_text", "").strip()
        print("review_text:", review_text)
        if not review_text:
            print("  Người dùng chỉ đánh giá sao, không nhập nhận xét")

        #   Lấy danh sách đơn hàng của user
        user_orders = Orders.objects.filter(
            userid=user.userid,  #   Nếu Orders.userid lưu Firebase UID → đổi thành userid=user.firebase_uid
            status__in=["paid", "delivered"]
        ).values_list("orderid", flat=True)
        print("  found orders:", list(user_orders))

        #   Kiểm tra sản phẩm có nằm trong các đơn hàng này không
        has_purchased = OrderItems.objects.filter(
            orderid__in=user_orders,
            productid=product_id
        ).exists()
        print("  has_purchased:", has_purchased)

        if not has_purchased:
            raise PermissionError("Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua.")

        #   Ngăn người dùng review trùng
        already_reviewed = ProductReview.objects.filter(
            product_id=product_id,
            userid=user.userid
        ).exists()
        print("  has_purchased:", has_purchased)

        if already_reviewed:
            raise PermissionError("Bạn đã đánh giá sản phẩm này rồi.")

        #  Nếu hợp lệ thì tạo review
        product_obj = Product.objects.get(productid=product_id)
        if "submission_time" in serializer.validated_data:
            serializer.validated_data.pop("submission_time")

        serializer.save(userid=user.userid, product=product_obj)
        print("== SQL query vừa chạy ==")
        for q in connection.queries[-3:]:
            print(q["sql"])
        # Cập nhật lại avg_rating và review_count trong schema sephora_recommendation
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE sephora_recommendation.products AS p
                SET
                    avg_rating = sub.avg_rating,
                    review_count = sub.review_count
                FROM (
                    SELECT
                        pr.productid,
                        ROUND(AVG(pr.rating)::numeric, 2) AS avg_rating,
                        COUNT(pr.reviewid) AS review_count
                    FROM sephora_recommendation.productreviews AS pr
                    WHERE pr.rating IS NOT NULL
                    GROUP BY pr.productid
                ) AS sub
                WHERE p.productid = sub.productid
                AND p.productid = %s;
            """, [product_id])

        print(f"Đã lưu review & cập nhật avg_rating cho sản phẩm {product_id}")



class ProductReviewLike(generics.UpdateAPIView):
    serializer_class = ProductReviewSerializer
    queryset = ProductReview.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        review = self.get_object()
        review.helpful_count = (review.helpful_count or 0) + 1
        review.save()
        return Response({"message": "Đã ghi nhận đánh giá hữu ích!"})

class ProductReviewDetail(generics.RetrieveUpdateAPIView):
    """
    API xem hoặc cập nhật 1 review cụ thể (dùng khi người dùng bấm vào ⭐ trong trang Orders)
    """
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ProductReview.objects.all()

    def get_queryset(self):
        """
        Chỉ cho phép user xem/sửa review của chính mình (theo Firebase UID)
        """
        firebase_user = getattr(self.request, "user", None)
        if not firebase_user or not getattr(firebase_user, "uid", None):
            return ProductReview.objects.none()

        user = User.objects.filter(firebase_uid=firebase_user.uid).first()
        if not user:
            return ProductReview.objects.none()

        return ProductReview.objects.filter(userid=user.userid)

    def update(self, request, *args, **kwargs):
        """
        Cho phép user chỉnh sửa lại review của mình
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)