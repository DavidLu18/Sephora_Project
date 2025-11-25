from django.db import models
from users.models import User  

class UserPaymentMethod(models.Model):
    METHOD_TYPES = (
        ('credit_card', 'Credit Card'),
        ('vnpay_wallet', 'VNPay Wallet'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    method_type = models.CharField(max_length=30, choices=METHOD_TYPES)

    display_name = models.CharField(max_length=100, null=True, blank=True)
    card_last4 = models.CharField(max_length=4, null=True, blank=True)
    card_brand = models.CharField(max_length=20, null=True, blank=True)

    fake_token = models.CharField(max_length=200)
    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        managed = False
        db_table = "user_payment_methods"
    def __str__(self):
        return f"{self.user.email} - {self.display_name}"
