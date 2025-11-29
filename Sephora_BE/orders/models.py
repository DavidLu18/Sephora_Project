from django.db import models
class Orders(models.Model):
    orderid = models.AutoField(primary_key=True)
    userid = models.IntegerField()
    addressid = models.IntegerField(null=True, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30)
    payment_method = models.CharField(max_length=50)
    shipping_method = models.CharField(max_length=50, null=True, blank=True)
    createdat = models.DateTimeField(auto_now_add=True)
    updatedat = models.DateTimeField(auto_now=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    
    class Meta:
        db_table = 'orders'
        managed = False
       

    def __str__(self):
        return f"Order {self.orderid} - User {self.userid}"


class OrderItems(models.Model):
    orderitemid = models.AutoField(primary_key=True)
    orderid = models.IntegerField()
    productid = models.IntegerField()
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'order_items'
        managed = False
