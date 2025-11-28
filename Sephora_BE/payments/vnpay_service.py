import hashlib
import hmac
from urllib.parse import quote_plus
from datetime import datetime, timedelta
from django.conf import settings


def generate_vnpay_payment_url(transaction_id, amount, order_info):
    # transaction_id lúc này KHÔNG convert sang int nữa
    # vì bạn dùng dạng chuỗi timestamp: "251128095607"
    # => convert int sẽ gây lỗi mất số 0 đầu hoặc format khác
    transaction_id = str(transaction_id)

    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNPAY_TMN_CODE,
        "vnp_Amount": str(int(amount * 100)),
        "vnp_CurrCode": "VND",

        # GIỮ nguyên chuỗi transaction_id -> KHÔNG format :06d
        "vnp_TxnRef": transaction_id,

        # NHẬN order_info TỪ CHECKOUT (chứa cartid)
        # VD: "cart-3"
        "vnp_OrderInfo": order_info,

        "vnp_OrderType": "other",
        "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": "127.0.0.1",
        "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": (datetime.now() + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S"),
        "vnp_Locale": "vn",
    }

    # 1. Sort theo key
    sorted_items = sorted(params.items())

    # 2. Build hash_data đúng chuẩn 2.1.0
    hash_parts = []
    for key, value in sorted_items:
        hash_parts.append(f"{quote_plus(str(key))}={quote_plus(str(value))}")
    hash_data = "&".join(hash_parts)

    # 3. Sinh chữ ký SHA512
    secure_hash = hmac.new(
        settings.VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()

    # 4. Query string gửi đi (encode giống hash_data)
    query_string = hash_data

    payment_url = f"{settings.VNPAY_PAYMENT_URL}?{query_string}&vnp_SecureHash={secure_hash}"

    # DEBUG
    print("\n================= VNPAY GENERATE DEBUG =================")
    print("PARAMS (SORTED):", dict(sorted_items))
    print("ORDER_INFO (DÙNG ĐỂ LẤY CARTID):", order_info)
    print("HASH_DATA (ENCODED):", hash_data)
    print("SECURE_HASH:", secure_hash)
    print("FINAL_URL:", payment_url)
    print("========================================================\n")

    return payment_url

from urllib.parse import quote_plus

def verify_vnpay_hash(data):
    print("\n================= VNPAY VERIFY DEBUG =================")

    received_hash = data.pop("vnp_SecureHash", "")
    data.pop("vnp_SecureHashType", None)  # phòng khi có

    print("VNPAY DATA RECEIVED:", data)
    print("VNP_SecureHash (received):", received_hash)

    # Sort & build hash_data **đã encode**
    sorted_items = sorted(data.items())
    hash_parts = []
    for key, value in sorted_items:
        hash_parts.append(f"{quote_plus(str(key))}={quote_plus(str(value))}")
    hash_data = "&".join(hash_parts)

    print("HASH_DATA REBUILT (ENCODED):", hash_data)

    generated_hash = hmac.new(
        settings.VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()

    print("HASH GENERATED:", generated_hash)
    print("HASH MATCH:", generated_hash == received_hash)
    print("====================================================\n")

    return generated_hash == received_hash
