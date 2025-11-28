from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import redirect
from django.conf import settings

from cart.models import Cart, CartItems
from products.models import Product
from orders.models import Orders, OrderItems
from .vnpay_service import verify_vnpay_hash



"""
==============================
 VNPAY RETURN (FE được gọi về)
==============================
- KHÔNG tạo đơn ở đây
- Chỉ hiển thị kết quả
- Đơn tạo ở IPN
"""
@api_view(["GET"])
def vnpay_return(request):
    data = request.GET.dict()

    if not verify_vnpay_hash(data.copy()):
        return Response({"success": False, "message": "Chữ ký không hợp lệ"})

    # Thanh toán thành công
    if data.get("vnp_ResponseCode") == "00" and data.get("vnp_TransactionStatus") == "00":

        # ============================
        # PARSE order_info dạng mới
        # ============================
        # cart-3|addr-7|phone-0909123456
        order_info = data.get("vnp_OrderInfo")

        parts = order_info.split("|")
        cart_id = int(parts[0].split("-")[1])
        address_id = int(parts[1].split("-")[1])
        phone_number = parts[2].split("-")[1]

        # ============================
        # Lấy giỏ hàng
        # ============================
        cart = Cart.objects.filter(cartid=cart_id).first()
        if not cart:
            return Response({"success": False, "message": "Không tìm thấy giỏ hàng"})

        items = CartItems.objects.filter(cartid=cart_id)
        if not items.exists():
            return Response({"success": False, "message": "Giỏ hàng trống"})

        # ============================
        # TÍNH TỔNG
        # ============================
        total = 0
        for i in items:
            product = Product.objects.get(productid=i.productid)
            total += product.price * i.quantity

        # ============================
        # TẠO ĐƠN (ĐÃ THÊM ADDRESS + PHONE)
        # ============================
        order = Orders.objects.create(
            userid=cart.userid,
            addressid=address_id,
            phone_number=phone_number,
            total=total,
            status="pending",
            payment_method="VNPAY",
            shipping_method="Tiêu chuẩn",
        )

        # Tạo order items
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
