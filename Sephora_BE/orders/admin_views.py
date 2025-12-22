from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny   # Tạm AllowAny cho bạn test
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Orders, OrderItems
from products.models import Product
from .serializers_admin import AdminOrderSerializer
from notifications.models import NotificationGlobal, NotificationUser
from users.models import User
class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = Orders.objects.all().order_by('-createdat')
    serializer_class = AdminOrderSerializer
    permission_classes = [AllowAny]

    def partial_update(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")

        # Xử lý nếu chuyển sang shipping (xác nhận đơn)
        if new_status == "shipping":
            items = OrderItems.objects.filter(orderid=order.orderid)

            for item in items:
                try:
                    product = Product.objects.get(productid=item.productid)
                except Product.DoesNotExist:
                    return Response({
                        "ok": False,
                        "message": f"Sản phẩm ID {item.productid} không tồn tại!"
                    }, status=400)

                if product.stock < item.quantity:
                    return Response({
                        "ok": False,
                        "message": f"Sản phẩm '{product.product_name}' không đủ hàng",
                        "stock": product.stock,
                        "required": item.quantity
                    }, status=400)

        # Lưu trạng thái
        order.status = new_status
        order.save()

        return Response(self.get_serializer(order).data)


    

@api_view(['POST'])
def admin_bulk_update_orders(request):
    order_ids = request.data.get("order_ids", [])
    new_status = request.data.get("status")

    if not order_ids or not new_status:
        return Response({"ok": False, "message": "Thiếu tham số"}, status=400)

    # Nếu không phải chuyển sang shipping thì cứ update bình thường
    if new_status != "shipping":
        Orders.objects.filter(orderid__in=order_ids).update(status=new_status)
        return Response({"ok": True, "updated": len(order_ids)})

    # -------------------------------
    # 1) LẤY TOÀN BỘ ITEM CỦA NHỮNG ĐƠN ĐƯỢC CHỌN
    # -------------------------------
    items = OrderItems.objects.filter(orderid__in=order_ids)

    # Gom số lượng theo product
    total_required = {}   # productid → total qty

    for item in items:
        total_required[item.productid] = total_required.get(item.productid, 0) + item.quantity

    # -------------------------------
    # 2) KIỂM TRA CỘNG DỒN TỒN KHO
    # -------------------------------
    insufficient = []

    for product_id, required_qty in total_required.items():
        try:
            product = Product.objects.get(productid=product_id)
        except Product.DoesNotExist:
            insufficient.append({
                "productid": product_id,
                "message": "Sản phẩm không tồn tại"
            })
            continue

        if product.stock < required_qty:
            insufficient.append({
                "productid": product_id,
                "product_name": product.product_name,
                "required": required_qty,
                "stock": product.stock,
                "message": "Không đủ hàng để XÁC NHẬN nhiều đơn"
            })

    if insufficient:
        return Response({
            "ok": False,
            "message": "Không đủ tồn kho để xác nhận đơn!",
            "details": insufficient
        }, status=400)

    # -------------------------------
    # 3) NẾU ĐỦ → TRỪ TỒN KHO
    # -------------------------------
    for product_id, required_qty in total_required.items():
        product = Product.objects.get(productid=product_id)
        product.stock -= required_qty
        product.save()

    # -------------------------------
    # 4) CẬP NHẬT TRẠNG THÁI ĐƠN
    # -------------------------------
    Orders.objects.filter(orderid__in=order_ids).update(status="shipping")

    return Response({"ok": True, "updated": len(order_ids)})


@api_view(['POST'])
def admin_bulk_delete_orders(request):
        ids = request.data.get("order_ids", [])

        if not ids:
            return Response({"error": "Missing order_ids"}, status=400)

        deleted, _ = Orders.objects.filter(orderid__in=ids).delete()
        return Response({"deleted": deleted}, status=200)

@api_view(['PATCH'])
def admin_update_order(request, id):
        try:
            order = Orders.objects.get(orderid=id)
        except Orders.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        status = request.data.get("status")
        if status:
            order.status = status
            order.save()

        serializer = AdminOrderSerializer(order)
        return Response(serializer.data)

@api_view(['POST'])
def admin_check_order(request):
    order_ids = request.data.get("order_ids", [])

    if not isinstance(order_ids, list) or len(order_ids) == 0:
        return Response({"ok": False, "message": "Bạn chưa chọn đơn hàng"}, status=400)

    results = []
    all_ok = True
    combined_required = {}  

    #Lặp từng đơn
    for oid in order_ids:
        try:
            order = Orders.objects.get(orderid=oid)
        except Orders.DoesNotExist:
            results.append({
                "orderid": oid,
                "ok": False,
                "message": "Không tìm thấy đơn hàng",
                "items": []
            })
            all_ok = False
            continue

        items = OrderItems.objects.filter(orderid=order.orderid)
        order_items_detail = []
        order_ok = True

        # Lặp từng sản phẩm trong đơn
        for item in items:
            try:
                product = Product.objects.get(productid=item.productid)
            except Product.DoesNotExist:
                order_items_detail.append({
                    "product_name": f"Product {item.productid}",
                    "required": item.quantity,
                    "stock": 0,
                    "status": "NOT_FOUND"
                })
                order_ok = False
                all_ok = False
                continue

            #Cộng dồn
            if product.productid not in combined_required:
                combined_required[product.productid] = {
                    "name": product.product_name,
                    "required": 0,
                    "stock": product.stock
                }

            combined_required[product.productid]["required"] += item.quantity

            #Kiểm tra từng đơn (không tính cộng dồn)
            status = "OK" if product.stock >= item.quantity else "NOT_ENOUGH"

            if status != "OK":
                order_ok = False
                all_ok = False

            order_items_detail.append({
                "product_name": product.product_name,
                "required": item.quantity,
                "stock": product.stock,
                "status": status
            })

        results.append({
            "orderid": oid,
            "ok": order_ok,
            "items": order_items_detail,
            "message": "Đủ hàng" if order_ok else "Thiếu hàng"
        })

    combined_warnings = []

    for pid, info in combined_required.items():
        if info["required"] > info["stock"]:   # 🔥 đây là check quan trọng nhất
            all_ok = False
            combined_warnings.append({
                "product_name": info["name"],
                "total_required": info["required"],
                "stock": info["stock"],
                "status": "NOT_ENOUGH"
            })

    return Response({
        "ok": all_ok,
        "orders": results,
        "combined": combined_warnings,
        "message": "Tất cả đơn đủ hàng" if all_ok else "Có sản phẩm thiếu hàng khi gộp nhiều đơn"
    })



@api_view(["POST"])
def admin_order_issue(request):
    order_ids = request.data.get("order_ids", [])
    reason = request.data.get("reason", "")

    if not order_ids or not reason:
        return Response({"message": "Thiếu order_ids hoặc reason"}, status=400)

    orders = Orders.objects.filter(orderid__in=order_ids)

    for o in orders:
        o.status = "cancelled"
        o.save()

        # Lấy ra user instance
        user_obj = User.objects.filter(userid=o.userid).first()

        if user_obj:
            NotificationUser.objects.create(
                user=user_obj,
                title="Đơn hàng gặp sự cố",
                message=f"Đơn #{o.orderid} đã bị hủy do: {reason}",
                type="order_issue"
            )

    return Response({"message": "Đã xử lý sự cố và gửi thông báo!"})
