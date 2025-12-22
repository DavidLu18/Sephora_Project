"use client";

import { useEffect, useState, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import ProductSidebarFilter from "@/components/ProductSidebarFilter";
import { getNewArrivals, getCategories, getBrands } from "@/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Brand } from "@/types/brand";

const PAGE_SIZE = 12;

export default function NewArrivalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    categoryId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    sortBy: "",
    brands: [] as number[],
    rating: null as number | null,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // ---------------------------------------------
  // 1️⃣ Load dữ liệu sản phẩm mới + brand + category
  // ---------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [products, cats, brandsData] = await Promise.all([
          getNewArrivals(200),
          getCategories(),
          getBrands(),
        ]);

        setAllProducts(products);
        setCategoriesData(cats);
        setBrands(brandsData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---------------------------------------------
  // 2️⃣ Lọc sản phẩm theo filters giống chosen-for-you
  // ---------------------------------------------
  useEffect(() => {
    let result = [...allProducts];

    if (filters.categoryId)
      result = result.filter(
        (p) =>
          p.category &&
          Number(p.category.category_id) === Number(filters.categoryId)
      );

    if (filters.minPrice !== null)
      result = result.filter((p) => Number(p.price ?? 0) >= filters.minPrice!);

    if (filters.maxPrice !== null)
      result = result.filter((p) => Number(p.price ?? 0) <= filters.maxPrice!);

    if (filters.brands.length > 0) {
      result = result.filter((p) =>
        filters.brands.some((brandId) => {
          const b = brands.find((bb) => bb.brand_id === brandId);
          return (
            b &&
            p.brand_name?.toLowerCase().trim() ===
              b.brand_name.toLowerCase().trim()
          );
        })
      );
    }

    if (filters.rating !== null)
      result = result.filter(
        (p) => Number(p.avg_rating ?? 0) >= (filters.rating ?? 0)
      );

    if (filters.sortBy === "sale")
      result = result.filter(
        (p) => p.sale_price && Number(p.sale_price) < Number(p.price ?? 0)
      );

    if (filters.sortBy === "price-asc")
      result.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));

    if (filters.sortBy === "price-desc")
      result.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));

    if (filters.sortBy === "name-asc")
      result.sort((a, b) => a.product_name.localeCompare(b.product_name));

    if (filters.sortBy === "name-desc")
      result.sort((a, b) => b.product_name.localeCompare(a.product_name));

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [filters, allProducts, brands]);

  // ---------------------------------------------
  // 3️⃣ Hàm thay đổi filter (giống chosen-for-you)
  // ---------------------------------------------
  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // ---------------------------------------------
  // 4️⃣ Pagination
  // ---------------------------------------------
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const products = filteredProducts.slice(start, end);

  if (loading)
    return <p className="p-6 text-gray-600">Đang tải sản phẩm...</p>;

  return (
    <main className="px-24 py-8 flex gap-8">
      {/* Sidebar lọc */}
      <ProductSidebarFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() =>
          setFilters({
            categoryId: null,
            minPrice: null,
            maxPrice: null,
            sortBy: "",
            brands: [],
            rating: null,
          })
        }
      />

      {/* Product list */}
      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Sản phẩm mới</h1>

        {/* Các bộ lọc đang áp dụng */}
        {(filters.brands.length > 0 ||
          filters.sortBy ||
          filters.rating ||
          filters.minPrice ||
          filters.maxPrice) && (
          <div className="flex flex-wrap gap-2 items-center mb-6 text-sm">

            {/* Rating */}
            {filters.rating && (
              <span className="bg-gray-100 border px-3 py-1 rounded-full flex items-center gap-1">
                {filters.rating}★ trở lên
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, rating: null }))
                  }
                >
                  ×
                </button>
              </span>
            )}

            {/* Giá */}
            {(filters.minPrice !== null || filters.maxPrice !== null) && (
              <span className="bg-gray-100 border px-3 py-1 rounded-full flex items-center gap-1">
                {filters.minPrice ?? "Min"} - {filters.maxPrice ?? "Max"}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: null,
                      maxPrice: null,
                    }))
                  }
                >
                  ×
                </button>
              </span>
            )}

            {/* Sort = sale */}
            {filters.sortBy === "sale" && (
              <span className="bg-gray-100 border px-3 py-1 rounded-full flex items-center gap-1">
                Sale
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, sortBy: "" }))
                  }
                >
                  ×
                </button>
              </span>
            )}

            {/* Xóa tất cả */}
            <button
              onClick={() =>
                setFilters({
                  categoryId: null,
                  minPrice: null,
                  maxPrice: null,
                  sortBy: "",
                  brands: [],
                  rating: null,
                })
              }
              className="text-blue-600 hover:underline ml-2"
            >
              Xóa
            </button>
          </div>
        )}

        {/* Products */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.productid} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 text-sm">
                {currentPage > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="p-2 border rounded hover:bg-gray-100"
                    >
                      <ChevronsLeft size={18} />
                    </button>

                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="p-2 border rounded hover:bg-gray-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </>
                )}

                {Array.from({ length: totalPages })
                  .map((_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                  )
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const needDot = prev && page - prev > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {needDot && <span>…</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded border ${
                            page === currentPage
                              ? "bg-black text-white border-black"
                              : "hover:bg-gray-100 border-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}

                {currentPage < totalPages && (
                  <>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="p-2 border rounded hover:bg-gray-100"
                    >
                      <ChevronRight size={18} />
                    </button>

                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-2 border rounded hover:bg-gray-100"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 mt-10">Không có sản phẩm nào.</p>
        )}
      </section>
    </main>
  );
}
