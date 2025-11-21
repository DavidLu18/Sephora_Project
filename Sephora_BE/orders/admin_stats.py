from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth

from .models import Orders, OrderItems
from products.models import Product


@api_view(["GET"])
@permission_classes([AllowAny])  # sau này đổi thành admin auth
def admin_dashboard_stats(request):

    total_revenue = Orders.objects.aggregate(total=Sum("total"))["total"] or 0
    total_orders = Orders.objects.count()

    order_status = Orders.objects.values("status").annotate(
        count=Count("orderid")
    )

    revenue_monthly = (
        Orders.objects
        .annotate(month=TruncMonth("createdat"))
        .values("month")
        .annotate(total=Sum("total"))
        .order_by("month")
    )

    orders_monthly = (
        Orders.objects
        .annotate(month=TruncMonth("createdat"))
        .values("month")
        .annotate(count=Count("orderid"))
        .order_by("month")
    )

    # Top 5 sản phẩm bán chạy (kèm tên + image)
    top_products_raw = (
        OrderItems.objects
        .values("productid")
        .annotate(qty=Sum("quantity"))
        .order_by("-qty")[:5]
    )

    top_products = []
    for item in top_products_raw:
        product = Product.objects.filter(productid=item["productid"]).first()
        top_products.append({
            "productid": item["productid"],
            "qty": item["qty"],
            "product_name": product.product_name if product else None,
            "image": (product.product_image.url if getattr(product, "product_image", None) else None)
        })

    return Response({
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "order_status": list(order_status),
        "revenue_monthly": list(revenue_monthly),
        "orders_monthly": list(orders_monthly),
        "top_products": top_products
    })
