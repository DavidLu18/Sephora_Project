from django.db import models
from django.conf import settings

from django.db import models
from django.conf import settings

class ProductReview(models.Model):
    reviewid = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        db_column='productid',
        to_field='productid',
        related_name='reviews'
    )
    userid = models.IntegerField(null=False) 
    rating = models.IntegerField()
    is_recommended = models.BooleanField(null=True)
    review_text = models.TextField(null=True, blank=True)
    review_title = models.CharField(max_length=255, null=True, blank=True)
    helpfulness = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    total_feedback_count = models.IntegerField(null=True, blank=True)
    total_neg_feedback_count = models.IntegerField(null=True, blank=True)
    total_pos_feedback_count = models.IntegerField(null=True, blank=True)
    sentiment = models.CharField(max_length=20, null=True, blank=True)
    review_images = models.TextField(null=True, blank=True)
    review_videos = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'productreviews'
        managed = False  # vì bảng đã tồn tại
        verbose_name = 'Product Review'

    def __str__(self):
        return f"Review {self.reviewid} - {self.product.product_name}"
