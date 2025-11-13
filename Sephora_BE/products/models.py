from django.db import models

class Brand(models.Model):
    brand_id = models.AutoField(primary_key=True)
    brand_name = models.CharField(max_length=255)

    class Meta:
        db_table = 'brands'
        managed = False  # không để Django tạo lại bảng

    def __str__(self):
        return self.brand_name


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')

    class Meta:
        db_table = 'categories'
        managed = False

    def __str__(self):
        return self.category_name

class Product(models.Model):
    productid = models.AutoField(primary_key=True)
    sku = models.CharField(max_length=100, null=True)
    product_name = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    currency = models.CharField(max_length=10, null=True)
    size = models.CharField(max_length=255, null=True)
    description = models.TextField(null=True)
    highlight = models.TextField(db_column='highlights', blank=True, null=True)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    review_count = models.IntegerField(default=0, null=True, blank=True)
    class Meta:
        db_table = 'products'
        managed = False

    def __str__(self):
        return self.product_name
    



