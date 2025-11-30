from django.db import models
from users.models import User


# GLOBAL NOTIFICATION — 1 dòng cho toàn bộ người dùng
class NotificationGlobal(models.Model):
    global_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50)  # promotion | flash_sale | system
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_global"

    def __str__(self):
        return self.title


# USER PERSONAL NOTIFICATION — lưu riêng cho từng user
class NotificationUser(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")

    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_user"
        indexes = [
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"


# 🟣 TEMPLATE
class NotificationTemplate(models.Model):
    template_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification_templates"

    def __str__(self):
        return self.title


# 🟡 SCHEDULED (gửi global theo lịch)
class ScheduledNotification(models.Model):
    schedule_id = models.AutoField(primary_key=True)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE)
    send_time = models.DateTimeField()
    target_group = models.CharField(max_length=50)  # all | inactive | vip | custom
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "scheduled_notifications"

    def __str__(self):
        return f"Scheduled: {self.template.title}"
