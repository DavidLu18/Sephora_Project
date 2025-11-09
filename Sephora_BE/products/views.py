from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Avg, Count, Q, F
from .models import Product, Brand, Category
from .serializers import ProductSerializer, BrandSerializer, CategorySerializer
from rest_framework.pagination import PageNumberPagination

# --- PRODUCT ---
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self):
         queryset = (
            Product.objects
            .annotate(
                reviews_count=Count('reviews', distinct=True),
                avg_rating=Avg('reviews__rating')
            )
            .select_related('brand', 'category')
            .order_by('productid')
        )
         return queryset

# --- BRAND ---
class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer


# --- CATEGORY ---
class CategoryTreeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(parent__isnull=True)
    serializer_class = CategorySerializer


@api_view(['GET'])
def chosen_for_you(request):
    products = (
        Product.objects
        .annotate(
            reviews_count=Count('reviews', distinct=True),
            avg_rating=Avg('reviews__rating')
        )
        .select_related('brand', 'category')
    )

    # --- Lọc theo các tiêu chí ---
    brand_ids = request.GET.getlist("brand")
    if brand_ids:
        products = products.filter(brand_id__in=brand_ids)

    category = request.GET.get("category")
    if category:
        products = products.filter(category_id=category)

    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    rating = request.GET.get("rating")
    if rating:
        # ⚠️ Ở đây phải filter trên annotation, nên phải annotate trước filter này
        products = products.filter(avg_rating__gte=float(rating))

    sort_by = request.GET.get("sort_by")
    if sort_by == "sale":
        products = products.filter(sale_price__lt=F('price'))

    products = products.order_by('-reviews_count', '-avg_rating')[:50]

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)



# --- NEW ARRIVALS ---
@api_view(['GET'])
def new_arrivals(request):
    """
    Sản phẩm mới nhất (lấy theo productid lớn nhất)
    """
    products = Product.objects.all().order_by('-productid')[:50]
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def products_by_categories(request):
    # Lấy danh sách ID danh mục từ tham số query
    category_ids = request.GET.getlist("category_ids")  # Dạng danh sách [1, 2, 3]

    # Khởi tạo queryset lấy tất cả sản phẩm
    products = (
        Product.objects
        .annotate(
            reviews_count=Count('reviews', distinct=True),
            avg_rating=Avg('reviews__rating')
        )
        .select_related('brand', 'category')
    )

    # Hàm để lấy tất cả danh mục con (bao gồm danh mục con lồng nhau)
    def get_all_subcategories(category_ids):
        subcategories = set(category_ids)  # Tập hợp các danh mục
        categories = Category.objects.filter(category_id__in=category_ids)
        
        # Tìm tất cả danh mục con (lặp để lấy cả danh mục con lồng nhau)
        while categories.exists():
            subcats = Category.objects.filter(parent_id__in=[cat.category_id for cat in categories])
            subcategories.update([cat.category_id for cat in subcats])
            categories = subcats  # Tiếp tục tìm danh mục con của danh mục con
        
        return subcategories

    # Kiểm tra nếu có category_ids được truyền qua
    if category_ids:
        # Lấy tất cả danh mục con của các category_ids (bao gồm cả danh mục cha)
        all_category_ids = get_all_subcategories(category_ids)
        
        # Lọc sản phẩm thuộc danh mục cha hoặc danh mục con
        products = products.filter(category_id__in=all_category_ids)

    # Lọc theo giá
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Lọc theo đánh giá
    rating = request.GET.get("rating")
    if rating:
        products = products.filter(avg_rating__gte=float(rating))

    # Sắp xếp sản phẩm
    sort_by = request.GET.get("sort_by")
    if sort_by == "sale":
        products = products.filter(sale_price__lt=F('price'))
    elif sort_by == "price_asc":
        products = products.order_by('price')
    elif sort_by == "price_desc":
        products = products.order_by('-price')
    else:
        products = products.order_by('-reviews_count', '-avg_rating')  # Mặc định

    # Phân trang kết quả
    paginator = ProductPagination()
    paginated_products = paginator.paginate_queryset(products, request)

    # Trả về kết quả phân trang
    serializer = ProductSerializer(paginated_products, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
def search_products(request):
    q = request.query_params.get("q", "").strip()
    min_price = request.query_params.get("min_price")
    max_price = request.query_params.get("max_price")
    rating = request.query_params.get("rating")
    sort_by = request.query_params.get("sort_by", "")
    brand_ids = request.query_params.get("brand_ids", "")

    products = (
        Product.objects
        .annotate(
            reviews_count=Count('reviews', distinct=True),
            avg_rating=Avg('reviews__rating')
        )
        .select_related('brand', 'category')
    )

    # Tìm theo tên hoặc mô tả
    if q:
        products = products.filter(
            Q(product_name__icontains=q) | Q(description__icontains=q)
        )

    # Lọc theo giá
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Lọc theo rating
    if rating:
        products = products.filter(avg_rating__gte=float(rating))

    # Lọc theo brand
    if brand_ids:
        ids = [int(bid) for bid in brand_ids.split(",") if bid.isdigit()]
        if ids:
            products = products.filter(brand_id__in=ids)

    # Sắp xếp
    if sort_by == "price_asc":
        products = products.order_by("price")
    elif sort_by == "price_desc":
        products = products.order_by("-price")
    elif sort_by == "rating_desc":
        products = products.order_by("-avg_rating")
    else:
        products = products.order_by("-productid")

    # Phân trang DRF
    paginator = ProductPagination()
    paginated_products = paginator.paginate_queryset(products, request)

    serializer = ProductSerializer(paginated_products, many=True)
    return paginator.get_paginated_response(serializer.data)

   

#Phân trang
class ProductPagination(PageNumberPagination):
    page_size = 12 
    page_size_query_param = 'size'  
    max_page_size = 100  