from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import os

from .models import Product, ProductImage
from .admin_serializers import (
    AdminProductSerializer,
    AdminProductImageSerializer
)


#  CRUD sản phẩm Admin
class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-productid")
    serializer_class = AdminProductSerializer


#  Upload ảnh sản phẩm
@api_view(["POST"])
def upload_product_image(request):
    product_id = request.data.get("product_id")
    file = request.FILES.get("file")

    if not file:
        return Response({"error": "Missing file"}, status=400)

    # Lấy product
    try:
        product = Product.objects.get(productid=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    # Lấy SKU hoặc fallback
    sku = product.sku or "product"

    # Lấy extension file (.jpg, .png...)
    import uuid
    ext = os.path.splitext(file.name)[1]

    # Đặt tên file mới: SKU + UUID + EXT
    filename = f"{sku}_{uuid.uuid4().hex}{ext}"

    # Đường dẫn lưu: MEDIA_ROOT/products/filename
    save_dir = os.path.join(settings.MEDIA_ROOT, "products")
    os.makedirs(save_dir, exist_ok=True)

    save_path = os.path.join(save_dir, filename)

    # Ghi file xuống server
    with open(save_path, "wb+") as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    # Đường dẫn URL để FE dùng
    image_url = f"/media/products/{filename}"

    # Tạo record trong DB
    new_img = ProductImage.objects.create(
        product=product,
        image_url=image_url,
        alt_text=sku
    )

    return Response(AdminProductImageSerializer(new_img).data, status=201)



#  Xóa ảnh
@api_view(["DELETE"])
def delete_product_image(request, image_id):
    try:
        img = ProductImage.objects.get(pk=image_id)
    except ProductImage.DoesNotExist:
        return Response({"error": "Image not found"}, status=404)

    img.delete()

    return Response({"message": "Deleted"}, status=200)
