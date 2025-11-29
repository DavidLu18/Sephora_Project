from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import auth
from firebase_admin._auth_utils import UserNotFoundError
from .models import User, UserRole
from .serializers import UserSerializer
from sephora.firebase_config import *   #  Thêm dòng này để khởi tạo firebase_admin
import traceback
from datetime import date

@api_view(['POST'])
def check_email(request):
    try:
        email = request.data.get("email")
        if not email:
            return Response({"message": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            firebase_user = auth.get_user_by_email(email)
            if not firebase_user.email_verified:
                auth.delete_user(firebase_user.uid)
                return Response({"message": "User chưa xác minh đã bị xóa. Có thể tạo lại."}, status=200)
            else:
                return Response({"message": "Email đã xác minh."}, status=409)
        except UserNotFoundError:
            return Response({"message": "Email chưa tồn tại."}, status=200)
        except Exception as err:
            print(" Firebase error:", err)
            traceback.print_exc()
            return Response({"message": str(err)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        print(" Outer error:", e)
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def register_user(request):
    """
    Đăng ký người dùng sau khi đã xác minh email trên Firebase
    """
    try:
        data = request.data
        email = data.get("email")
        firebase_uid = data.get("uid")
        firstname = data.get("firstname", "")
        lastname = data.get("lastname", "")
        phone = data.get("phone", "")
        gender = data.get("gender", "")
        birthMonth = data.get("birthMonth")
        birthDay = data.get("birthDay")

        # Kiểm tra email bắt buộc
        if not email:
            return Response({"message": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra tồn tại Firebase user
        try:
            firebase_user = auth.get_user_by_email(email)
            if not firebase_user.email_verified:
                return Response(
                    {"message": "Email chưa được xác minh."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except UserNotFoundError:
            return Response(
                {"message": "Người dùng không tồn tại trong Firebase."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kiểm tra trùng trong PostgreSQL
        if User.objects.filter(email=email).exists():
            return Response({"message": "Người dùng đã tồn tại."}, status=status.HTTP_200_OK)

        # Xử lý ngày sinh từ birthMonth & birthDay (năm mặc định 2000)
        birth_date = None
        if birthMonth and birthDay:
            try:
                birth_date = date(2000, int(birthMonth), int(birthDay))
            except Exception:
                birth_date = None

        # Tạo user mới trong PostgreSQL
        user = User.objects.create(
            firebase_uid=firebase_uid or firebase_user.uid,
            email=email,
            firstname=firstname,
            lastname=lastname,
            phone=phone,
            gender=gender,
            dateofbirth=birth_date,
            emailverified=True,
            registrationsource="firebase",
            isactive=True
        )
        UserRole.objects.get_or_create(user=user, defaults={"role": "customer"})

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(" Error in register_user:", e)
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
def login_user(request):
    """
    Đăng nhập bằng Firebase ID Token (sau khi xác minh email)
    """
    try:
        id_token = request.data.get('token')
        decoded_token = auth.verify_id_token(id_token)
        email = decoded_token.get('email')

        user, created = User.objects.get_or_create(email=email)
        user.emailverified = True
        user.save()
        UserRole.objects.get_or_create(user=user, defaults={"role": "customer"})

        return Response(UserSerializer(user).data)

    except Exception as e:
        print(" Error in login_user:", e)
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_user(request):
    email = request.GET.get("email")
    if not email:
        return Response({"message": "Thiếu email"}, status=400)
    try:
        user = User.objects.select_related("role_entry").get(email=email)
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({"message": "Không tìm thấy user"}, status=404)
    
@api_view(["PUT"])
def update_user(request):
    email = request.data.get("email")
    if not email:
        return Response({"message": "Thiếu email"}, status=400)

    try:
        user = User.objects.get(email=email)
        user.firstname = request.data.get("firstname", user.firstname)
        user.lastname = request.data.get("lastname", user.lastname)
        user.phone = request.data.get("phone", user.phone)
        if "dateofbirth" in request.data:
            user.dateofbirth = request.data["dateofbirth"]
        user.save()
        return Response(UserSerializer(user).data, status=200)
    except User.DoesNotExist:
        return Response({"message": "Không tìm thấy user"}, status=404)
    
@api_view(['PUT'])
def confirm_email_update(request):
    email = request.data.get("email")
    new_email = request.data.get("new_email")

    if not email or not new_email:
        return Response({"error": "Thiếu thông tin"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Không tìm thấy người dùng"}, status=404)

    #  Ở đây bạn có thể kiểm tra với Firebase hoặc trường `is_email_verified`
    # Nếu chưa có cột đó, bạn tạm bỏ qua dòng kiểm tra này
    user.email = new_email
    user.save()

    return Response({"success": True, "message": "Email đã được cập nhật thành công"})

@api_view(["GET"])
def get_user_profile(request):
    user_uid = getattr(request.user, "uid", None)
    if not user_uid:
        return Response({"error": "Bạn chưa đăng nhập"}, status=401)

    # Lấy user trực tiếp bằng firebase_uid
    user = User.objects.filter(firebase_uid=user_uid).first()
    if not user:
        return Response({"error": "Không tìm thấy user"}, status=404)

    return Response({
        "userid": user.userid,
        "firstname": user.firstname,
        "lastname": user.lastname,
        "email": user.email,
        "phone": user.phone,
        "dateofbirth": user.dateofbirth,
    })
