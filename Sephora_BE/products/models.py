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

    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, null=True, db_column="brand_id")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, db_column="category_id")

    price = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    value_price = models.DecimalField(max_digits=12, decimal_places=2, null=True)     
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True)

    currency = models.CharField(max_length=10, null=True)
    size = models.CharField(max_length=255, null=True,blank=True)

    description = models.TextField(null=True,blank=True)
    highlight = models.TextField(db_column='highlights', blank=True, null=True)       
    ingredients = models.TextField(blank=True, null=True)
    skin_types = models.TextField(null=True, blank=True)                               

    is_exclusive = models.BooleanField(null=True, blank=True)                          
    online_only = models.BooleanField(null=True, blank=True)                           
    out_of_stock = models.BooleanField(null=True, blank=True)                          
    is_limited_edition = models.BooleanField(null=True, blank=True)                    
    is_new = models.BooleanField(null=True, blank=True)                                

    stock = models.IntegerField(default=0)

    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    review_count = models.IntegerField(default=0, null=True, blank=True)

    created_at = models.DateTimeField(null=True, blank=True)                           
    updated_at = models.DateTimeField(null=True, blank=True)                           

    class Meta:
        db_table = 'products'
        managed = False

    def __str__(self):
        return self.product_name

    
class ProductImage(models.Model):
    image_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.CharField(max_length=255)
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    upload_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        managed = False

    def __str__(self):
        return self.image_url



