from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Cart, CartItems
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product
from orders.models import Orders, OrderItems
from users.models import User  # model user trong DB


class CartViewSet(viewsets.ViewSet):
    """
    API cho giỏ hàng: /api/cart/
    Firebase đã lưu firebase_uid trong bảng users từ khi đăng nhập.
    """

    def get_userid_from_firebase(self, firebase_uid):
        """
         Lấy user.userid dựa theo firebase_uid (đã có trong bảng users)
        """
        try:
            user = User.objects.get(firebase_uid=firebase_uid)
            return user.userid
        except User.DoesNotExist:
            return None

    def list(self, request):
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        #  Map UID → userid trong DB
        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng trong hệ thống"}, status=404)

        cart = Cart.objects.filter(userid=user_id).first()
        if not cart:
            return Response({"items": []})

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def add(self, request):
        """
        Thêm 1 hoặc nhiều sản phẩm vào giỏ hàng.
        FE có thể gửi 1 object hoặc 1 list các object.
        """
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng trong hệ thống"}, status=404)

        # Tạo giỏ hàng (nếu chưa có)
        cart, _ = Cart.objects.get_or_create(userid=user_id)

        data = request.data
        # Trường hợp FE gửi danh sách nhiều sản phẩm
        if isinstance(data, list):
            added_items = []
            for item in data:
                product_id = item.get("product_id") or item.get("productid")
                qty = int(item.get("quantity", 1))
                if not product_id:
                    continue

                cart_item, created = CartItems.objects.get_or_create(
                    cartid=cart.cartid, productid=product_id
                )
                if not created:
                    cart_item.quantity += qty
                cart_item.save()
                added_items.append(CartItemSerializer(cart_item).data)

            return Response(
                {"message": "Đã thêm nhiều sản phẩm vào giỏ hàng", "items": added_items},
                status=200,
            )

        # Trường hợp FE gửi 1 sản phẩm duy nhất (object)
        product_id = data.get("product_id") or data.get("productid")
        qty = int(data.get("quantity", 1))

        if not product_id:
            return Response({"error": "Thiếu product_id"}, status=400)

        item, created = CartItems.objects.get_or_create(
            cartid=cart.cartid, productid=product_id
        )
        if not created:
            item.quantity += qty
        item.save()

        return Response(CartItemSerializer(item).data, status=200)


    @action(detail=False, methods=["post"])
    def remove(self, request):
        item_id = request.data.get("item_id")
        if not item_id:
            return Response({"error": "Thiếu item_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Xóa sản phẩm khỏi giỏ hàng
        cart_item = CartItems.objects.filter(cartitemid=item_id).first()
        if not cart_item:
            return Response({"error": "Không tìm thấy sản phẩm trong giỏ hàng."}, status=status.HTTP_404_NOT_FOUND)
        
        cart_item.delete()
        return Response({"message": "Sản phẩm đã được xóa khỏi giỏ hàng."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng trong hệ thống"}, status=404)

        cart = Cart.objects.filter(userid=user_id).first()
        if not cart:
            return Response({"message": "Giỏ hàng trống"}, status=400)

        items = CartItems.objects.filter(cartid=cart.cartid)
        if not items.exists():
            return Response({"message": "Giỏ hàng trống"}, status=400)

        #  Tính tổng tiền
        total = 0
        for i in items:
            try:
                product = Product.objects.get(productid=i.productid)
                total += (product.price or 0) * i.quantity
            except Product.DoesNotExist:
                continue

        #  Tạo đơn hàng
        order = Orders.objects.create(
            userid=user_id,
            total=total,
            status="pending",
            payment_method=request.data.get("payment_method", "Thanh toán khi nhận hàng"),
            shipping_method="Tiêu chuẩn",
        )

        for i in items:
            try:
                product = Product.objects.get(productid=i.productid)
                OrderItems.objects.create(
                    orderid=order.orderid,
                    productid=i.productid,
                    quantity=i.quantity,
                    price=product.price or 0,
                )
            except Product.DoesNotExist:
                continue

        #  Xóa giỏ hàng sau khi thanh toán
        items.delete()

        return Response(
            {"message": "Thanh toán thành công", "order_id": order.orderid},
            status=200,
        )
    @action(detail=False, methods=["post"])
    def update_quantity(self, request):
        """
        Cập nhật số lượng của 1 sản phẩm trong giỏ hàng
        """
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity")

        if not item_id or quantity is None:
            return Response({"error": "Thiếu dữ liệu item_id hoặc quantity"}, status=400)

        try:
            item = CartItems.objects.get(cartitemid=item_id)
        except CartItems.DoesNotExist:
            return Response({"error": "Không tìm thấy sản phẩm trong giỏ hàng"}, status=404)

        try:
            quantity = int(quantity)
        except ValueError:
            return Response({"error": "Số lượng không hợp lệ"}, status=400)

        if quantity <= 0:
            item.delete()
            return Response({"message": "Đã xóa sản phẩm khỏi giỏ hàng"})

        item.quantity = quantity
        item.save()

        return Response(
            {
                "message": "Cập nhật số lượng thành công",
                "item": CartItemSerializer(item).data,
            },
            status=200,
        )
