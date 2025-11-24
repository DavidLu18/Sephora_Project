from .models import NotificationGlobal, NotificationUser
from users.models import User


# 🔵 Gửi thông báo chung (global)
def send_global_notification(title, message, noti_type="system"):
    NotificationGlobal.objects.create(
        title=title,
        message=message,
        type=noti_type
    )


# 🟢 Gửi thông báo cá nhân
def send_user_notification(user, title, message, noti_type="system"):
    NotificationUser.objects.create(
        user=user,
        title=title,
        message=message,
        type=noti_type
    )
