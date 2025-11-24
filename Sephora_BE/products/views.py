from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q, F
from .models import Product, Brand, Category
from .serializers import ProductSerializer, BrandSerializer, CategorySerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework import status

# ---------------------
# PAGINATION CLASS
# ---------------------
class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'size'
    max_page_size = 100


# ---------------------
# PRODUCT VIEWSET (ADMIN + LIST)
# ---------------------
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    def get_queryset(self):
        request = self.request
        qs = (
            Product.objects
            .select_related("brand", "category")
            .prefetch_related("images")
            .order_by("productid")
        )
        # --------------------
        # 1. SEARCH: name, sku, code
        # --------------------
        search = request.GET.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(product_name__icontains=search) |
                Q(sku__icontains=search) |
                Q(productid__icontains=search)
            )

        # --------------------
        # 2. BRAND FILTER
        # FE gửi brand_id hoặc brand_name
        # --------------------
        brand = request.GET.get("brand", "").strip()
        if brand:
            if brand.isdigit():
                qs = qs.filter(brand_id=int(brand))
            else:
                qs = qs.filter(brand__brand_name__iexact=brand)

        # --------------------
        # 3. CATEGORY FILTER (cha → con → cháu)
        # --------------------
        category = request.GET.get("category", "").strip()
        if category:

            # FE gửi category_id thì parse int
            if category.isdigit():
                category_id = int(category)
            else:
                # FE gửi tên (ít dùng)
                try:
                    category_id = Category.objects.get(category_name__iexact=category).category_id
                except Category.DoesNotExist:
                    return qs.none()

            # Hàm tìm con cháu
            def get_all_subcategories(ids):
                result = set(ids)
                queue = list(ids)

                while queue:
                    sub = Category.objects.filter(parent_id__in=queue)
                    sub_ids = [c.category_id for c in sub]

                    if not sub_ids:
                        break

                    result.update(sub_ids)
                    queue = sub_ids

                return result

            all_cat_ids = get_all_subcategories([category_id])
            qs = qs.filter(category_id__in=all_cat_ids)

        # --------------------
        # 4. STATUS FILTER (NHIỀU CHỌN)
        # query: ?status=exclusive&status=online
        # hoặc: ?status=exclusive,online
        # --------------------
        status_raw = request.GET.getlist("status")
        statuses = []

        # nếu FE gửi dạng "exclusive,online,limited"
        for s in status_raw:
            if "," in s:
                statuses.extend([x.strip() for x in s.split(",") if x.strip()])
            else:
                statuses.append(s.strip())

        statuses = set(statuses)  # remove duplicate

        for st in statuses:
            if st.lower() == "exclusive":
                qs = qs.filter(exclusive=True)
            elif st.lower() == "online":
                qs = qs.filter(online_only=True)
            elif st.lower() == "outofstock":
                qs = qs.filter(stock__lte=0)
            elif st.lower() == "limited":
                qs = qs.filter(limited=True)
            elif st.lower() == "new": 
                qs = qs.filter(is_new=True)
        return qs
# ---------------------
# BRAND
# ---------------------
class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by("brand_id")
    serializer_class = BrandSerializer
    
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"message": "Brand deleted"}, status=status.HTTP_200_OK)    



# ---------------------
# CATEGORY
# ---------------------
class CategoryTreeViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(parent__isnull=True)
    serializer_class = CategorySerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"message": "Category deleted"}, status=status.HTTP_200_OK)
# ---------------------
# CHOSEN FOR YOU
# ---------------------
@api_view(['GET'])
def chosen_for_you(request):
    products = Product.objects.select_related('brand', 'category')

    # Filter brand
    brand_ids = request.GET.getlist("brand")
    if brand_ids:
        products = products.filter(brand_id__in=brand_ids)

    # Filter category
    category = request.GET.get("category")
    if category:
        products = products.filter(category_id=category)

    # Price range
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Rating
    rating = request.GET.get("rating")
    if rating:
        products = products.filter(avg_rating__gte=float(rating))

    # Sort
    sort_by = request.GET.get("sort_by")
    if sort_by == "sale":
        products = products.filter(sale_price__lt=F('price'))

    # Sort by popularity + highest rating
    products = products.order_by('-review_count', '-avg_rating')[:50]

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


# ---------------------
# NEW ARRIVALS
# ---------------------
@api_view(['GET'])
def new_arrivals(request):
    products = Product.objects.select_related(
        "brand", "category"
    ).order_by('-productid')[:50]

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


# ---------------------
# PRODUCTS BY CATEGORIES
# ---------------------
@api_view(['GET'])
def products_by_categories(request):
    category_ids = request.GET.getlist("category_ids")

    products = Product.objects.select_related("brand", "category")

    # Hàm tìm danh mục con (recursive)
    def get_all_subcategories(category_ids):
        subcategories = set(category_ids)
        categories = Category.objects.filter(category_id__in=category_ids)

        while categories.exists():
            subcats = Category.objects.filter(parent_id__in=[c.category_id for c in categories])
            subcategories.update([c.category_id for c in subcats])
            categories = subcats

        return subcategories

    # Filter by multiple categories (including children)
    if category_ids:
        all_category_ids = get_all_subcategories(category_ids)
        products = products.filter(category_id__in=all_category_ids)

    # Price filter
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Rating
    rating = request.GET.get("rating")
    if rating:
        products = products.filter(avg_rating__gte=float(rating))

    # Sorting
    sort_by = request.GET.get("sort_by")
    if sort_by == "sale":
        products = products.filter(sale_price__lt=F('price'))
    elif sort_by == "price_asc":
        products = products.order_by('price')
    elif sort_by == "price_desc":
        products = products.order_by('-price')
    else:
        products = products.order_by('-review_count', '-avg_rating')

    # Pagination
    paginator = ProductPagination()
    paginated_products = paginator.paginate_queryset(products, request)

    serializer = ProductSerializer(paginated_products, many=True)
    return paginator.get_paginated_response(serializer.data)


# ---------------------
# SEARCH PRODUCTS
# ---------------------
@api_view(['GET'])
def search_products(request):
    q = request.query_params.get("q", "").strip()
    min_price = request.query_params.get("min_price")
    max_price = request.query_params.get("max_price")
    rating = request.query_params.get("rating")
    sort_by = request.query_params.get("sort_by", "")
    brand_ids = request.query_params.get("brand_ids", "")

    products = Product.objects.select_related("brand", "category")

    # Search by name or description
    if q:
        products = products.filter(
            Q(product_name__icontains=q) |
            Q(description__icontains=q)
        )

    # Price filters
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Rating filter
    if rating:
        products = products.filter(avg_rating__gte=float(rating))

    # Brand filter
    if brand_ids:
        ids = [int(b) for b in brand_ids.split(",") if b.isdigit()]
        if ids:
            products = products.filter(brand_id__in=ids)

    # Sorting
    if sort_by == "price_asc":
        products = products.order_by("price")
    elif sort_by == "price_desc":
        products = products.order_by("-price")
    elif sort_by == "rating_desc":
        products = products.order_by("-avg_rating")
    else:
        products = products.order_by("-productid")

    # Pagination
    paginator = ProductPagination()
    paginated_products = paginator.paginate_queryset(products, request)

    serializer = ProductSerializer(paginated_products, many=True)
    return paginator.get_paginated_response(serializer.data)

