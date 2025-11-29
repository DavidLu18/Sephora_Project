from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import redirect
from django.conf import settings

from cart.models import Cart, CartItems
from products.models import Product
from orders.models import Orders, OrderItems
from .vnpay_service import verify_vnpay_hash
from users.models import User  

from django.utils import timezone  # Để lấy thời gian hiện tại
from promotions.models import Voucher  # Để lấy Voucher (mã giảm giá)
from promotions.models import VoucherUsage  # Để lưu thông tin vào bảng voucher_usage
from decimal import Decimal

"""
==============================
 VNPAY RETURN (FE được gọi về)
==============================
- KHÔNG tạo đơn ở đây
- Chỉ hiển thị kết quả
- Đơn tạo ở IPN
"""
def calculate_discount(voucher, total):
    discount_amount = Decimal(0)  # Khởi tạo discount_amount kiểu Decimal
    if voucher.discount_type == "percent":
        # Chuyển voucher.discount_value thành Decimal
        discount_amount = total * (Decimal(voucher.discount_value) / Decimal('100'))
        if voucher.max_discount:
            discount_amount = min(discount_amount, Decimal(voucher.max_discount))
    elif voucher.discount_type == "fixed":
        discount_amount = Decimal(voucher.discount_value)
        if voucher.max_discount:
            discount_amount = min(discount_amount, Decimal(voucher.max_discount))
        discount_amount = min(discount_amount, total)

    print(f"Tính toán giảm giá: {discount_amount}")  # Debug giảm giá
    return discount_amount

@api_view(["GET"])
def vnpay_return(request):
    data = request.GET.dict()

    if not verify_vnpay_hash(data.copy()):
        return Response({"success": False, "message": "Chữ ký không hợp lệ"})

    # Thanh toán thành công
    if data.get("vnp_ResponseCode") == "00" and data.get("vnp_TransactionStatus") == "00":

        # ============================ PARSE order_info dạng mới ============================
        order_info = data.get("vnp_OrderInfo")
        print(f"Order Info: {order_info}") 
        parts = order_info.split("|")
        cart_id = int(parts[0].split("-")[1])
        address_id = int(parts[1].split("-")[1])
        phone_number = parts[2].split("-")[1]
        voucher_code = parts[3].split("-")[1] if len(parts) > 3 else ""
        
        print(f"Voucher code từ VNPay: {voucher_code}")

        # ============================ Lấy giỏ hàng ============================
        cart = Cart.objects.filter(cartid=cart_id).first()
        if not cart:
            return Response({"success": False, "message": "Không tìm thấy giỏ hàng"})

        items = CartItems.objects.filter(cartid=cart_id)
        if not items.exists():
            return Response({"success": False, "message": "Giỏ hàng trống"})

        # ============================ TÍNH TỔNG ============================
        total_before_discount = 0  # Tổng tiền trước khi áp dụng voucher
        total = 0  # Giá sau khi áp dụng giảm giá

        for i in items:
            product = Product.objects.get(productid=i.productid)
            total_before_discount += product.price * i.quantity  # Tính tổng tiền trước giảm
            total += product.price * i.quantity  # Giá sau giảm

        # ============================ KIỂM TRA VOUCHER ============================
        discount_amount = 0  # Khởi tạo discount_amount mặc định là 0
        if voucher_code:
            voucher = Voucher.objects.filter(code=voucher_code).first()
            if voucher:
                print(f"Voucher tồn tại: {voucher.code}")
                # Tính số tiền giảm từ voucher
                discount_amount = calculate_discount(voucher, total_before_discount)  # Sử dụng total_before_discount thay vì total
                print(f"Số tiền giảm từ voucher: {discount_amount}")

                # Trừ vào tổng tiền
                total -= discount_amount
                total = max(total, 0)
                print(f"Tổng tiền sau khi giảm giá: {total}")

        # ============================ Tạo đơn hàng ============================
        # Tạo đơn hàng sau khi tính toán giảm giá
        order = Orders.objects.create(
            userid=cart.userid,
            addressid=address_id,
            phone_number=phone_number,
            total=total,  # Gửi tổng tiền đã giảm
            status="pending",
            payment_method="VNPAY",
            shipping_method="Tiêu chuẩn",
        )   
        user = User.objects.filter(userid=cart.userid).first()
        # Lưu vào bảng VoucherUsage nếu có voucher
        if voucher_code and voucher:
            VoucherUsage.objects.create(
                user=user,   
                voucher_id=voucher.voucher_id,
                order_id=order.orderid,  # Lưu vào bảng voucher_usage
                discount_amount=discount_amount,
                used_time=timezone.now(),
                used=True
            )

        # ============================ Tạo Order Items ============================
        for i in items:
            product = Product.objects.get(productid=i.productid)
            OrderItems.objects.create(
                orderid=order.orderid,
                productid=i.productid,
                quantity=i.quantity,
                price=product.price
            )

        # Xóa giỏ hàng sau khi tạo đơn
        items.delete()

        return Response({
            "success": True,
            "message": "Thanh toán thành công – đơn hàng đã được tạo",
            "order_id": order.orderid
        })

    return Response({
        "success": False,
        "message": "Thanh toán thất bại hoặc bị hủy"
    })





"""
============================================
 VNPAY IPN (BACKEND – tạo đơn tại đây)
============================================
- Xác thực chữ ký
- Kiểm tra trạng thái thanh toán
- Tạo đơn
- Xóa giỏ hàng
"""
@api_view(["GET"])
def vnpay_ipn(request):
    print("\n================= VNPAY IPN DEBUG =================")
    print("IPN QUERY:", request.GET)
    print("===================================================\n")
    data = request.GET.dict()
    if "vnp_SecureHash" not in data:
        return Response({"RspCode": "97", "Message": "Thiếu chữ ký"})

    if not verify_vnpay_hash(data.copy()):
        return Response({"RspCode": "97", "Message": "Sai chữ ký"})

    txn_ref = data.get("vnp_TxnRef")   # transaction_id = cartid
    response_code = data.get("vnp_ResponseCode")
    status_code = data.get("vnp_TransactionStatus")

    # Check thanh toán thành công
    if response_code == "00" and status_code == "00":
        cart_id = int(txn_ref)
        cart = Cart.objects.filter(cartid=cart_id).first()

        if not cart:
            return Response({"RspCode": "01", "Message": "Không tìm thấy giỏ hàng"})

        items = CartItems.objects.filter(cartid=cart_id)
        if not items.exists():
            return Response({"RspCode": "02", "Message": "Giỏ hàng trống"})

        # Tính tổng
        total = 0
        for it in items:
            total += it.quantity * it.product.price

        # TẠO ĐƠN
        order = Orders.objects.create(
            userid=cart.userid,
            total=total,
            status="pending",
            payment_method="VNPAY",
            shipping_method="Tiêu chuẩn",
        )

        # Tạo Order items
        for it in items:
            OrderItems.objects.create(
                orderid=order.orderid,
                productid=it.productid,
                quantity=it.quantity,
                price=it.product.price
            )

        # Xóa giỏ
        items.delete()

        return Response({"RspCode": "00", "Message": "Xác nhận thành công"})

    # Thanh toán thất bại
    return Response({"RspCode": "00", "Message": "Giao dịch thất bại"})
