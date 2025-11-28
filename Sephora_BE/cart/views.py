from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Cart, CartItems
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product
from orders.models import Orders, OrderItems
from users.models import User  # model user trong DB
import random, time
from addresses.models import Address
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
        # ===========================
        # 1) Lấy user từ Firebase uid
        # ===========================
        user_uid = getattr(request.user, "uid", None)
        if not user_uid:
            return Response({"error": "Bạn chưa đăng nhập"}, status=401)

        user_id = self.get_userid_from_firebase(user_uid)
        if not user_id:
            return Response({"error": "Không tìm thấy người dùng"}, status=404)

        # Lấy đối tượng User
        user = User.objects.filter(userid=user_id).first()
        if not user:
            return Response({"error": "Không tìm thấy user"}, status=404)

        phone_number = user.phone or ""

        # ======================================
        # 2) Lấy address_id FE gửi lên & kiểm tra
        # ======================================
        address_id = request.data.get("address_id", None)
        if not address_id:
            return Response({"error": "Bạn chưa chọn địa chỉ giao hàng"}, status=400)

        try:
            address_id = int(address_id)
        except:
            return Response({"error": "Địa chỉ không hợp lệ"}, status=400)

        # Kiểm tra address có thuộc user không?
        address = Address.objects.filter(addressid=address_id, userid_id=user_id).first()
        if not address:
            return Response({"error": "Địa chỉ không thuộc về bạn"}, status=400)

        # ===========================
        # 3) Lấy giỏ hàng
        # ===========================
        cart = Cart.objects.filter(userid=user_id).first()
        if not cart:
            return Response({"message": "Giỏ hàng trống"}, status=400)

        items = CartItems.objects.filter(cartid=cart.cartid)
        if not items.exists():
            return Response({"message": "Giỏ hàng trống"}, status=400)

        # ===========================
        # 4) Tính tổng tiền
        # ===========================
        total = 0
        cart_items_data = []

        for i in items:
            try:
                product = Product.objects.get(productid=i.productid)
                total += (product.price or 0) * i.quantity
                cart_items_data.append({
                    "productid": i.productid,
                    "quantity": i.quantity
                })
            except Product.DoesNotExist:
                continue

        payment_method = request.data.get("payment_method", "COD").upper()

        # ==========================================================
        # CASE 1️⃣: COD — Tạo đơn ngay lập tức
        # ==========================================================
        if payment_method == "COD":
            order = Orders.objects.create(
                userid=user_id,
                addressid=address_id,
                total=total,
                status="pending",
                payment_method="COD",
                shipping_method="Tiêu chuẩn",
                phone_number=phone_number,
            )

            # tạo order items
            for item in cart_items_data:
                product = Product.objects.get(productid=item["productid"])
                OrderItems.objects.create(
                    orderid=order.orderid,
                    productid=item["productid"],
                    quantity=item["quantity"],
                    price=product.price
                )

            # Xóa giỏ hàng
            items.delete()

            return Response(
                {"message": "Đặt hàng COD thành công", "order_id": order.orderid},
                status=200
            )

        # ==========================================================
        # CASE 2️⃣: VNPAY — Không tạo đơn, chỉ tạo transaction
        # ==========================================================
        elif payment_method == "VNPAY":
            from payments.vnpay_service import generate_vnpay_payment_url
            from datetime import datetime

            transaction_id = datetime.now().strftime("%y%m%d%H%M%S")

            # Nhét thông tin để IPN tạo đơn:
            # (1) cartid
            # (2) address_id
            # (3) phone
            order_info = f"cart-{cart.cartid}|addr-{address_id}|phone-{phone_number}"

            payment_url = generate_vnpay_payment_url(
                transaction_id,
                total,
                order_info
            )

            return Response({
                "success": True,
                "payment_url": payment_url,
                "transaction_id": transaction_id,
                "cartid": cart.cartid,
                "address_id": address_id
            })

        # ==========================================================
        # CASE 3️⃣: phương thức thanh toán không hợp lệ
        # ==========================================================
        else:
            return Response({"error": "Phương thức thanh toán không hợp lệ"}, status=400)


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
    

