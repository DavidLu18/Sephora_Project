"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductSidebarFilter from "@/components/ProductSidebarFilter";
import { Product } from "@/types/product";
import { Brand } from "@/types/brand";
import { getBrands } from "@/api";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

const PAGE_SIZE = 12;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<{
    categoryId: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    sortBy: string;
    brands: number[];
    rating: number | null;
    }>({
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    sortBy: "",
    brands: [],
    rating: null,
    });

  // 🔹 Lấy danh sách brand
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands();
        setBrands(data);
      } catch (err) {
        console.error("Lỗi khi tải brand:", err);
      }
    };
    fetchBrands();
  }, []);

  // 🔹 Gọi API tìm kiếm sản phẩm
  const fetchProducts = useCallback(async () => {
    if (!query) return;
    try {
      setLoading(true);
    const params: { [key: string]: string | number | boolean | null | undefined } = {
        q: query,
        page: currentPage,
        size: PAGE_SIZE,
    };

      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.rating) params.rating = filters.rating;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.brands.length > 0)
        params.brand_ids = filters.brands.join(",");

        const queryString = new URLSearchParams(
        Object.entries(params)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString();
      const res = await fetch(
        `http://127.0.0.1:8000/api/products/search/?${queryString}`
      );

      if (!res.ok) throw new Error("Không thể tải kết quả tìm kiếm");
      const data = await res.json();

      setAllProducts(data.results || data); // hỗ trợ cả dạng list hoặc paginated
      setFilteredProducts(data.results || data);
      const totalCount = data.count || data.length || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [query, filters, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 🔹 Khi đổi filter
  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setCurrentPage(1);
    },
    []
  );

  // ⏳ Loading / Error
  if (loading)
    return (
      <main className="px-6 py-6 flex justify-center">
        <p className="text-gray-600">Đang tải kết quả tìm kiếm...</p>
      </main>
    );

  if (error)
    return (
      <main className="px-6 py-6 flex justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );

  return (
    <main className="px-24 py-8 flex gap-8">
      {/* Sidebar lọc sản phẩm */}
      <ProductSidebarFilter
        onFilterChange={handleFilterChange}
        filters={filters}
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
      {/* Danh sách sản phẩm */}
      <section className="flex-1">
        <h1 className="text-2xl font-semibold mb-6">
          Kết quả cho: <span className="text-purple-600">{query}</span>
        </h1>

        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
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
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, idx, visiblePages) => {
                    const prevPage = visiblePages[idx - 1];
                    const needEllipsis = prevPage && page - prevPage > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {needEllipsis && <span className="px-2">...</span>}
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
          <p className="text-gray-500">Không tìm thấy sản phẩm phù hợp.</p>
        )}
      </section>
    </main>
  );
}
