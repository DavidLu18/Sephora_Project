from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from products.models import Product, Brand, Category
from orders.models import Orders
from .models import OrderItems

@api_view(["GET"])
@permission_classes([AllowAny])
def admin_dashboard_stats(request):
    # Lọc theo status (all | pending | delivered | cancelled)
    status_filter = request.GET.get("status", "all")

    base_qs = Orders.objects.all()
    if status_filter != "all":
        base_qs = base_qs.filter(status=status_filter)

    # ==========================
    # 1. Tổng doanh thu delivered
    # ==========================
    total_revenue = base_qs.filter(status="delivered").aggregate(
        total=Sum("total")
    )["total"] or 0

    delivered_revenue = total_revenue
    total_orders = base_qs.count()
    delivered_count = base_qs.filter(status="delivered").count()

    # ==========================
    # 2. Order theo status toàn hệ thống (sau filter)
    # ==========================
    order_status = (
        base_qs.values("status")
        .annotate(count=Count("orderid"))
    )

    # ==========================
    # 3. Order theo status từng tháng + doanh thu từng tháng
    # ==========================
    months = (
        base_qs
        .annotate(month=TruncMonth("createdat"))
        .values("month")
        .order_by("month")
        .distinct()
    )

    orders_monthly_status = []
    monthly_stats = []   # ⭐ FE dùng cái này cho chart

    for m in months:
        month = m["month"]

        # status count theo từng tháng (để filter)
        stats = (
            base_qs
            .filter(createdat__month=month.month)
            .values("status")
            .annotate(count=Count("orderid"))
        )
        status_dict = {s["status"]: s["count"] for s in stats}

        orders_monthly_status.append({
            "month": month,
            "status_counts": status_dict
        })

        # orders & revenue theo tháng
        month_qs = base_qs.filter(createdat__month=month.month)

        orders_count = month_qs.count()

        # doanh thu: chỉ tính đơn delivered (kể cả đang filter "all")
        revenue = Orders.objects.filter(
            createdat__month=month.month,
            status="delivered"
        ).aggregate(
            total=Sum("total")
        )["total"] or 0

        monthly_stats.append({
            "month": month.strftime("%Y-%m"),  # ví dụ: 2025-10
            "orders": orders_count,
            "revenue": revenue,
        })

    # ==========================
    # 4. Top 5 sản phẩm bán chạy
    # ==========================
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
        })

    # ==========================
    # 5. Thống kê sản phẩm/brand/category
    # ==========================
    total_products = Product.objects.count()
    out_of_stock_products = Product.objects.filter(out_of_stock=True).count()
    total_brands = Brand.objects.count()
    total_categories = Category.objects.count()

    return Response({
        "total_revenue": total_revenue,
        "delivered_revenue": delivered_revenue,
        "total_orders": total_orders,
        "delivered_count": delivered_count,

        "order_status": list(order_status),

        "orders_monthly_status": orders_monthly_status,  # bạn vẫn dùng cho filter
        "monthly_stats": monthly_stats,                  # ⭐ dữ liệu vẽ chart

        "top_products": top_products,

        "total_products": total_products,
        "out_of_stock_products": out_of_stock_products,
        "total_brands": total_brands,
        "total_categories": total_categories,
    })
