from django.db import models
from django.conf import settings
from products.models import Product

class Cart(models.Model):
    cartid = models.AutoField(primary_key=True)
    userid = models.IntegerField()  # giữ nguyên kiểu INT vì bảng DB đã dùng userid INTEGER
    createdat = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart'  
        managed = False 
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"Cart {self.cartid} (User {self.userid})"


class CartItems(models.Model):
    cartitemid = models.AutoField(primary_key=True)
    cartid = models.IntegerField()
    productid = models.IntegerField()
    quantity = models.IntegerField(default=1)
    addedat = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart_items'
        managed = False
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"

    # Optional helper
    def subtotal(self):
        try:
            product = Product.objects.get(productid=self.productid)
            return product.price * self.quantity if product.price else 0
        except Product.DoesNotExist:
            return 0
