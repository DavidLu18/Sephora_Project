# wishlists/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import User
from .models import WishList


@receiver(post_save, sender=User)
def create_default_wishlist(sender, instance, created, **kwargs):
    """
    Khi tạo user mới -> tạo 1 wishlist mặc định "Yêu thích"
    """
    if created:
        WishList.objects.create(
            user=instance,
            name="Yêu thích",
            is_default=True,
        )
