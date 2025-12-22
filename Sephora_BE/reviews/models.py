from django.db import models
from django.conf import settings
import os
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
def review_image_path(instance, filename):
    # Tách tên + đuôi
    original_name, ext = os.path.splitext(filename)

    # Làm sạch tên file gốc (bỏ ký tự lạ)
    original_name = original_name.replace(" ", "_").replace("/", "_")

    # Lấy userid
    uid = getattr(instance.review, 'userid', 'user')

    # Lấy reviewid
    review_id = instance.review.reviewid

    # Tạo UUID để không trùng file
    

    # Tạo tên file mới: uid_reviewid_originalName_uuid.ext
    new_filename = f"{uid}_{review_id}_{original_name}_{ext.lower()}"

    # Trả về đường dẫn lưu trong MEDIA_ROOT
    return f"review/{review_id}/{new_filename}"

class ReviewImage(models.Model):
    id = models.AutoField(primary_key=True)

    review = models.ForeignKey(
        ProductReview,
        related_name="images",
        on_delete=models.CASCADE
    )

    image = models.ImageField(upload_to=review_image_path)

    class Meta:
        db_table = "review_images"

    def __str__(self):
        return f"Image of review {self.review.reviewid}"
