
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Product, ProductReview

def update_rating(productid):
    agg = ProductReview.objects.filter(product_id=productid).aggregate(
        avg=Avg("rating"), 
        cnt=Count("reviewid")
    )

    Product.objects.filter(productid=productid).update(
        avg_rating=agg["avg"] or 0,
        review_count=agg["cnt"] or 0
    )

@receiver(post_save, sender=ProductReview)
def review_saved(sender, instance, created, **kwargs):
    update_rating(instance.product_id)

@receiver(post_delete, sender=ProductReview)
def review_deleted(sender, instance, **kwargs):
    update_rating(instance.product_id)
