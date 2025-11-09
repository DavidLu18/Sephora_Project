from firebase_admin import auth
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from sephora import firebase_config  # đảm bảo Firebase đã init


class FirebaseUser:
    """Lớp user giả định cho Firebase"""
    def __init__(self, decoded_token):
        for k, v in decoded_token.items():
            setattr(self, k, v)
        self.is_authenticated = True
        self.is_active = True  # fix lỗi DRF kiểm tra user.is_active

    def __str__(self):
        return self.email if hasattr(self, "email") else self.uid


class FirebaseAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        token_header = request.headers.get("Authorization")
        print("🔹 Authorization Header:", token_header)
        if not token_header or not token_header.startswith("Bearer "):
            request.user = None
            return None

        id_token = token_header.split("Bearer ")[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user = FirebaseUser(decoded_token)  # ✅ dùng lớp mới
            print(f"✅ Verified UID: {decoded_token.get('uid')}, Email: {decoded_token.get('email')}")
        except Exception as e:
            print("❌ Firebase token error:", e)
            return JsonResponse({"error": "Token Firebase không hợp lệ hoặc hết hạn"}, status=401)

        return None
