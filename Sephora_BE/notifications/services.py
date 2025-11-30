# notifications/services.py
from .models import NotificationGlobal, NotificationUser
from users.models import User


# Gửi thông báo chung (global) – 1 dòng cho tất cả user
def send_global_notification(title, message, noti_type="system"):
    return NotificationGlobal.objects.create(
        title=title,
        message=message,
        type=noti_type
    )


# Gửi thông báo cá nhân (nhận User instance)
def send_user_notification(user, title, message, noti_type="system"):
    return NotificationUser.objects.create(
        user=user,
        title=title,
        message=message,
        type=noti_type
    )


# Gửi thông báo cá nhân theo user_id (tiện dùng trong service khác)
def send_user_notification_by_id(user_id, title, message, noti_type="system"):
    user = User.objects.filter(userid=user_id).first()
    if not user:
        return None
    return send_user_notification(user, title, message, noti_type)


#  Gửi thông báo "cho tất cả mọi người"
# Có 2 kiểu:
# 1. Chỉ tạo NotificationGlobal -> FE lấy 1 lần là đủ (nhẹ DB hơn)
# 2. (Optional) Fan-out ra NotificationUser cho từng user -> nếu bạn cần is_read, badge đếm chưa đọc
def send_notification_to_all(title, message, noti_type="system", fanout_to_users=False):
    # luôn tạo bản GLOBAL
    global_noti = send_global_notification(title, message, noti_type)

    if fanout_to_users:
        users = User.objects.filter(is_active=True)

        bulk = [
            NotificationUser(
                user=u,
                title=title,
                message=message,
                type=noti_type
            )
            for u in users
        ]
        NotificationUser.objects.bulk_create(bulk)

    return global_noti
