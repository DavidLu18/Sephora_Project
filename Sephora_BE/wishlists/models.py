# wishlists/models.py
from django.db import models
from users.models import User
from products.models import Product


# wishlists/models.py
from django.db import models
from users.models import User
from products.models import Product


class WishList(models.Model):
    """
    Mỗi user có:
    - 1 wishlist mặc định
    - N wishlist tự đặt tên
    """

    wishlistid = models.AutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="userid",              # cột thật trong DB
        related_name="wishlists"
    )

    name = models.CharField(max_length=255)

    is_default = models.BooleanField(
        default=False,
        db_column="is_default"          # cột thật trong DB
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_column="createdat"           # cột thật trong DB
    )

    class Meta:
        db_table = "wishlists"
        unique_together = ("user", "name")

    def __str__(self):
        return f"{self.user.userid} - {self.name}"


class WishListItem(models.Model):
    """
    Wishlist item: mỗi record là 1 sản phẩm thuộc 1 wishlist
    """

    id = models.AutoField(primary_key=True)

    wishlist = models.ForeignKey(
        WishList,
        on_delete=models.CASCADE,
        db_column="wishlistid",         # cột thật trong DB
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        db_column="productid"           # cột thật trong DB
    )

    class Meta:
        db_table = "wishlist_items"
        unique_together = ("wishlist", "product")

    def __str__(self):
        return f"Wishlist {self.wishlist_id} - Product {self.product_id}"
