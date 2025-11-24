from django.db import models
from users.models import User

class PromotionCampaign(models.Model):
    DISCOUNT_TYPE = [
        ("percent", "Percent"),
        ("fixed", "Fixed Amount"),
        ("free_ship", "Free Shipping"),
    ]

    campaign_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    apply_scope = models.CharField(max_length=20, default="product")  
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_order = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    is_flash_sale = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "promotion_campaigns"

    def __str__(self):
        return f"{self.title}"

    def is_running(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.start_time <= now <= self.end_time
class CampaignCategory(models.Model):
    campaign = models.ForeignKey(PromotionCampaign, on_delete=models.CASCADE)
    category = models.ForeignKey('products.Category', on_delete=models.CASCADE)

    class Meta:
        db_table = "campaign_categories"
        unique_together = ("campaign", "category")

class CampaignBrand(models.Model):
    campaign = models.ForeignKey(PromotionCampaign, on_delete=models.CASCADE)
    brand = models.ForeignKey('products.Brand', on_delete=models.CASCADE)

    class Meta:
        db_table = "campaign_brands"
        unique_together = ("campaign", "brand")


class PromotionProduct(models.Model):
    campaign = models.ForeignKey(
        PromotionCampaign,
        on_delete=models.CASCADE,
        db_column="campaign_id"
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        db_column="product_id"
    )

    class Meta:
        db_table = "promotion_products"
        unique_together = ("campaign", "product")

    def __str__(self):
        return f"Campaign {self.campaign_id} - Product {self.product_id}"

class Voucher(models.Model):
    DISCOUNT_TYPE = [
        ("percent", "Percent"),
        ("fixed", "Fixed Amount")
    ]

    voucher_id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)

    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)

    min_order = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    usage_limit = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)

    user_limit = models.IntegerField(default=1)

    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vouchers"

    def __str__(self):
        return self.code

    # Kiểm tra user có đủ điều kiện dùng voucher không
    def can_use(self, user):
        from django.utils import timezone

        now = timezone.now()

        if not self.is_active:
            return False

        if self.start_time and now < self.start_time:
            return False

        if self.end_time and now > self.end_time:
            return False

        if self.usage_limit and self.used_count >= self.usage_limit:
            return False

        user_used = VoucherUsage.objects.filter(
            user=user, voucher=self, used=True
        ).count()

        return user_used < self.user_limit

class VoucherUsage(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="userid"
    )
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.CASCADE,
        db_column="voucher_id"
    )
    used = models.BooleanField(default=False)
    used_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "voucher_usage"
        unique_together = ("user", "voucher")

    def __str__(self):
        return f"{self.user.email} - {self.voucher.code}"
