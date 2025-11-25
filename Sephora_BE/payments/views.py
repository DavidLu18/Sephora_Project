from rest_framework.decorators import api_view
from rest_framework.response import Response
from users.models import User
from orders.models import Orders
from .models import UserPaymentMethod
from .serializers import UserPaymentMethodSerializer


def get_user_from_firebase(firebase_uid):
    try:
        return User.objects.get(firebase_uid=firebase_uid)
    except User.DoesNotExist:
        return None


@api_view(['GET'])
def get_payment_methods(request):
    user_uid = getattr(request.user, "uid", None)

    if not user_uid:
        return Response({"error": "Bạn chưa đăng nhập"}, status=401)

    user = get_user_from_firebase(user_uid)
    if not user:
        return Response({"error": "Không tìm thấy người dùng"}, status=404)

    methods = UserPaymentMethod.objects.filter(user=user).order_by("-is_default")
    serializer = UserPaymentMethodSerializer(methods, many=True)
    return Response(serializer.data)



@api_view(['POST'])
def add_payment_method(request):
    user_uid = getattr(request.user, "uid", None)

    if not user_uid:
        return Response({"error": "Bạn chưa đăng nhập"}, status=401)

    user = get_user_from_firebase(user_uid)
    if not user:
        return Response({"error": "Không tìm thấy người dùng"}, status=404)

    serializer = UserPaymentMethodSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # nếu gửi is_default = true -> tắt default cũ
    if serializer.validated_data.get("is_default"):
        UserPaymentMethod.objects.filter(user=user).update(is_default=False)

    payment_method = serializer.save(user=user)   # 👈 gán user ở đây

    return Response(UserPaymentMethodSerializer(payment_method).data, status=201)



@api_view(['DELETE'])
def delete_payment_method(request, method_id):
    user_uid = getattr(request.user, "uid", None)
    user = get_user_from_firebase(user_uid)

    if not user:
        return Response({"error": "Không tìm thấy người dùng"}, status=404)

    method = UserPaymentMethod.objects.filter(id=method_id, user=user).first()
    if not method:
        return Response({"error": "Không tìm thấy phương thức"}, status=404)

    method.delete()
    return Response({"message": "Đã xóa"}, status=200)


@api_view(['PUT'])
def set_default_payment_method(request, method_id):
    user_uid = getattr(request.user, "uid", None)
    user = get_user_from_firebase(user_uid)

    if not user:
        return Response({"error": "Không tìm thấy người dùng"}, status=404)

    method = UserPaymentMethod.objects.filter(id=method_id, user=user).first()
    if not method:
        return Response({"error": "Không tìm thấy phương thức"}, status=404)

    UserPaymentMethod.objects.filter(user=user).update(is_default=False)
    method.is_default = True
    method.save()

    return Response({"message": "Đặt mặc định thành công"})


@api_view(["GET"])
def vnpay_return(request):
        params = request.query_params
        order_id = params.get("vnp_TxnRef")
        code = params.get("vnp_ResponseCode")

        order = Orders.objects.get(orderid=order_id)

        if code == "00":
            order.status = "paid"
            order.save()
            return Response({"message": "Thanh toán VNPay thành công"})

        order.status = "failed"
        order.save()
        return Response({"message": "Thanh toán thất bại"})
