from django.db import models
from users.models import User   # FK đến bảng users của bạn

class Address(models.Model):
    addressid = models.AutoField(primary_key=True)
    userid = models.ForeignKey(User, on_delete=models.CASCADE, db_column="userid")

    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, null=True, blank=True)
    street = models.CharField(max_length=255, null=True, blank=True)
    zipcode = models.CharField(max_length=20, null=True, blank=True)

    isdefault = models.BooleanField(default=False)
    createdat = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "addresses" 

    def save(self, *args, **kwargs):
        # nếu set default → bỏ default ở address khác
        if self.isdefault:
            Address.objects.filter(userid=self.userid, isdefault=True).update(isdefault=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.street}, {self.city}"
