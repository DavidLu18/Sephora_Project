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
        voucher = Voucher.objects.filter(code=code, is_active=True).first()

        if not voucher:
            return Response({"error": "Voucher không tồn tại"}, status=404)

        user = User.objects.get(userid=request.user.userid)

        if not voucher.can_use(user):
            return Response({"error": "Không đủ điều kiện dùng voucher"}, status=400)

        return Response(VoucherSerializer(voucher).data)
