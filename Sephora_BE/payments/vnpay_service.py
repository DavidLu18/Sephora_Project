import hashlib
import hmac
from urllib.parse import urlencode, quote
from datetime import datetime, timedelta
from django.conf import settings


def generate_vnpay_payment_url(order_id, amount):
    order_id = int(order_id)

    expire_date = (datetime.now() + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S")

    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNPAY_TMN_CODE,
        "vnp_Amount": str(int(amount * 100)),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": f"{order_id:06d}",
        "vnp_OrderInfo": f"Thanh toan don hang {order_id}",
        "vnp_OrderType": "other",
        "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": "127.0.0.1",
        "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": expire_date,
        "vnp_Locale": "vn",
    }

    # Sort parameters alphabetically
    sorted_params = dict(sorted(params.items()))

    # Build hash data (NOT encoded)
    hash_data = urlencode(sorted_params)

    # Build query string (encoded safely)
    query_string = urlencode(sorted_params, quote_via=quote)

    # Create secure hash
    secure_hash = hmac.new(
        settings.VNPAY_HASH_SECRET.encode(),
        hash_data.encode(),
        hashlib.sha512,
    ).hexdigest()

    vnpay_url = f"{settings.VNPAY_PAYMENT_URL}?{query_string}&vnp_SecureHash={secure_hash}"

    return vnpay_url
