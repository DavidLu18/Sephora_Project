from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import PromotionCampaign, Voucher, VoucherUsage
from .serializers import PromotionCampaignSerializer, VoucherSerializer
from users.models import User

class FlashSaleAPIView(APIView):
    def get(self, request):
        now = timezone.now()
        qs = PromotionCampaign.objects.filter(
            is_flash_sale=True,
            is_active=True,
            start_time__lte=now,
            end_time__gte=now
        )
        return Response(PromotionCampaignSerializer(qs, many=True).data)


class ApplyVoucherAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code")
        order_total = request.data.get("order_total")

        if not code:
            return Response({"valid": False, "message": "Thiếu mã voucher."}, status=400)

        if order_total is None:
            return Response({"valid": False, "message": "Thiếu tổng tiền đơn hàng."}, status=400)
         # Lấy user Firebase
        firebase_user = request.user

        # FirebaseUser có .uid
        firebase_uid = getattr(firebase_user, "uid", None)
        if not firebase_uid:
            return Response({"valid": False, "message": "Không tìm thấy user"}, status=401)

        # Tìm User trong database dựa vào uid
        try:
            user = User.objects.get(firebase_uid=firebase_uid)
        except User.DoesNotExist:
            return Response({"valid": False, "message": "Không tìm thấy user trong hệ thống"}, status=404)
        # Convert order_total to float
        try:
            order_total = float(order_total)
        except:
            return Response({"valid": False, "message": "Tổng tiền không hợp lệ."}, status=400)

        # Lấy voucher
        voucher = Voucher.objects.filter(
            code__iexact=code,
            is_active=True
        ).first()

        if not voucher:
            return Response({"valid": False, "message": "Voucher không tồn tại."}, status=404)


        # Check logic (hạn dùng, giới hạn user, usage_limit,...)
        can_use, reason = voucher.can_use(user)

        if can_use is False:   # <-- kiểm tra CHÍNH XÁC
            return Response(
                {
                    "valid": False,
                    "message": reason or "Bạn không đủ điều kiện dùng voucher."
                },
                status=400
            )
        # ================== TÍNH GIẢM GIÁ ==================
        discount = 0

        # % giảm
        if voucher.discount_type == "percent":
            discount = order_total * (float(voucher.discount_value) / 100.0)
            if voucher.max_discount:
                discount = min(discount, float(voucher.max_discount))

        # giảm cố định tiền
        elif voucher.discount_type == "fixed":
            discount = float(voucher.discount_value)
            if voucher.max_discount:
                discount = min(discount, float(voucher.max_discount))
            discount = min(discount, order_total)

        final_total = max(order_total - discount, 0)

        return Response({
            "valid": True,
            "code": voucher.code,
            "discount_amount": discount,
            "final_total": final_total,
            "message": "Áp dụng voucher thành công!"
        })


class AvailableVouchersView(APIView):
    """
    API trả về danh sách voucher user có thể dùng:
    - Voucher còn hiệu lực thời gian
    - is_active = True
    - usage_limit chưa vượt mức
    - user chưa vượt user_limit
    - dùng đúng hàm can_use(user)
    """

    def get(self, request):
        # Lấy user từ JWT Firebase Token đang hoạt động
        user = request.user
        if not hasattr(user, "uid"):
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        # Convert Firebase UID → user_id trong DB
        db_user = User.objects.filter(firebase_uid=user.uid).first()
        if not db_user:
            return Response({"error": "Không tìm thấy user"}, status=404)

        now = timezone.now()

        # Lấy tất cả voucher đang hoạt động & còn trong thời gian sử dụng
        vouchers = Voucher.objects.filter(
            is_active=True,
            start_time__lte=now,
            end_time__gte=now
        )

        valid_vouchers = []

        # Dùng hàm can_use(user) bạn đã viết
        for v in vouchers:
            ok, _ = v.can_use(db_user)
            if ok:
                valid_vouchers.append(v)

        serializer = VoucherSerializer(valid_vouchers, many=True)
        return Response(serializer.data)