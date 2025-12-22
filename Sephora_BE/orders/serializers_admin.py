from rest_framework import serializers
from .models import Orders, OrderItems  
from users.models import User
from addresses.models import Address
from promotions.models import VoucherUsage, Voucher
from products.models import Product
from django.conf import settings
class AdminOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    

    class Meta:
        model = OrderItems
        fields = ["orderitemid", "productid", "product_name", "quantity", "price", "image"]

    def get_product_name(self, obj):
        
        product = Product.objects.filter(productid=obj.productid).first()
        return product.product_name if product else None

    def get_image(self, obj):
        product = Product.objects.filter(productid=obj.productid).first()
        if not product:
            return settings.MEDIA_URL + "products/default.jpg"

        # Nếu có ảnh thật (quan hệ ProductImage)
        first_image = product.images.first()
        if first_image:
            return first_image.image_url  # vì bạn đang lưu image_url dạng string

        # Nếu không có ảnh → ảnh mặc định
        return settings.MEDIA_URL + "products/default.jpg"

    def get_voucher(self, obj):
        usage = VoucherUsage.objects.filter(order_id=obj.orderid).first()
        if not usage:
            return None

        voucher = usage.voucher  # ForeignKey — có thể dùng trực tiếp

        return {
            "voucher_code": voucher.code,
            "discount_type": voucher.discount_type,        # "percent" / "fixed"
            "discount_value": float(voucher.discount_value),
            "discount_amount": float(usage.discount_amount),
            "used_time": usage.used_time,
    }


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    voucher = serializers.SerializerMethodField()
    class Meta:
        model = Orders
        fields = [
            "orderid",
            "userid",
            "user_email",
            "addressid",
            "total",
            "status",
            "payment_method",
            "shipping_method",
            "createdat",
            "updatedat",
            "items",
            "address",
            "phone",
            "voucher",
            
        ]

    def get_user_email(self, obj):
        user = User.objects.filter(userid=obj.userid).first()
        return user.email if user else None

    def get_items(self, obj):
        qs = OrderItems.objects.filter(orderid=obj.orderid)
        return AdminOrderItemSerializer(qs, many=True).data
    def get_address(self, obj):
        if not obj.addressid:
            return None

        try:
            addr = Address.objects.get(addressid=obj.addressid)
            return {
                "street": addr.street,
                "district": addr.district,
                "city": addr.city,
                "country": addr.country,
                "zipcode": addr.zipcode,
            }
        except Address.DoesNotExist:
            return None

    def get_phone(self, obj):
        # ưu tiên phone_number trong đơn hàng
        if obj.phone_number:
            return obj.phone_number

        # fallback sang địa chỉ
        if obj.addressid:
            try:
                addr = Address.objects.get(addressid=obj.addressid)
                # Lấy phone từ bảng User (vì Address không có phone)
                return addr.userid.phone
            except:
                pass

        return None
    def get_voucher(self, obj):
        usage = VoucherUsage.objects.filter(order_id=obj.orderid).first()
        if not usage:
            return None

        voucher = usage.voucher  # ForeignKey — có thể dùng trực tiếp

        return {
            "voucher_code": voucher.code,
            "discount_type": voucher.discount_type,        # "percent" / "fixed"
            "discount_value": float(voucher.discount_value),
            "discount_amount": float(usage.discount_amount),
            "used_time": usage.used_time,
    }
