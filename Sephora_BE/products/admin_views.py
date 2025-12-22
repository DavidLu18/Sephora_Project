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

    # SKU
    sku = product.sku or "product"

    # Lấy extension file
    ext = os.path.splitext(file.name)[1].lower()
    filename = f"{sku}{ext}"  # 👉 đặt tên theo SKU

    # Directory lưu ảnh
    save_dir = os.path.join(settings.MEDIA_ROOT, "products")
    os.makedirs(save_dir, exist_ok=True)

    save_path = os.path.join(save_dir, filename)

    # Nếu đã có file ảnh cũ → xóa đi
    if os.path.exists(save_path):
        os.remove(save_path)

    # Save file mới
    with open(save_path, "wb+") as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    # URL trả về cho FE
    image_url = f"/media/products/{filename}"

    # Nếu bạn muốn mỗi sản phẩm chỉ có 1 ảnh → xóa record cũ
    ProductImage.objects.filter(product=product).delete()

    # Tạo record mới
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


@api_view(["DELETE"])
def delete_product_image_by_product(request, product_id):
    """
    Xóa ảnh theo product_id (mỗi sản phẩm 1 hình).
    Khớp với FE: DELETE /api/admin/products/<product_id>/image/
    """
    # Tìm product
    try:
        product = Product.objects.get(productid=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    # Lấy ảnh đầu tiên (vì mỗi product chỉ có 1 hình)
    img = ProductImage.objects.filter(product=product).first()
    if not img:
        return Response({"error": "Image not found"}, status=404)

    # Xóa file trên ổ cứng
    if img.image_url:
        # image_url dạng: /media/products/xxx.jpg
        relative_path = img.image_url.replace("/media/", "")
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        if os.path.exists(file_path):
            os.remove(file_path)

    # Xóa record DB
    img.delete()

    return Response({"message": "Deleted"}, status=200)