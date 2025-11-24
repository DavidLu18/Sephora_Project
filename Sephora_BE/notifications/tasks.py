from celery import shared_task
from django.utils import timezone
from promotions.models import PromotionCampaign
from notifications.services import send_notification_to_all

@shared_task
def notify_flash_sale_started():
    now = timezone.now()

    campaigns = PromotionCampaign.objects.filter(
        is_flash_sale=True,
        is_active=True,
        start_time__lte=now,
        start_time__gte=now - timezone.timedelta(minutes=1)
    )

    for c in campaigns:
        send_notification_to_all(
            title="FLASH SALE BẮT ĐẦU ⚡",
            message=f"{c.title} đã bắt đầu! Mua ngay trước khi hết!",
            noti_type="flash_sale"
        )


@shared_task
def notify_flash_sale_upcoming():
    now = timezone.now()
    soon = now + timezone.timedelta(minutes=30)

    campaigns = PromotionCampaign.objects.filter(
        is_flash_sale=True,
        is_active=True,
        start_time__gte=now,
        start_time__lte=soon
    )

    for c in campaigns:
        send_notification_to_all(
            title="FLASH SALE SẮP DIỄN RA ⏳",
            message=f"{c.title} sẽ bắt đầu sau 30 phút!",
            noti_type="flash_sale"
        )
