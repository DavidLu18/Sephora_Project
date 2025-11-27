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
  const [ctaDismissed, setCtaDismissed] = useState(false);
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

  useEffect(() => {
    setCtaDismissed(false);
  }, [query]);

  const openPersonalizedModal = useCallback(() => {
    if (!query) return;
    window.dispatchEvent(
      new CustomEvent("openPersonalizedSearch", {
        detail: { query },
      })
    );
  }, [query]);

  useEffect(() => {
    if (!query || typeof window === "undefined") return;
    try {
      const key = `personalized-search:${query.toLowerCase()}`;
      if (sessionStorage.getItem(key)) {
        return;
      }
      sessionStorage.setItem(key, "shown");
      window.dispatchEvent(
        new CustomEvent("openPersonalizedSearch", {
          detail: { query },
        })
      );
    } catch {
      // Ignore session storage errors (e.g., private mode)
    }
  }, [query]);

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
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl font-semibold">
            Kết quả cho: <span className="text-purple-600">{query}</span>
          </h1>
          {!ctaDismissed && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                  SephoraAI gợi ý riêng cho bạn
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Cá nhân hóa ngay dựa trên tìm kiếm “{query}” và tình trạng da của bạn để nhận danh sách phù hợp hơn.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openPersonalizedModal}
                  className="rounded-full bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-black/90"
                >
                  Nhận gợi ý cá nhân hóa
                </button>
                <button
                  onClick={() => setCtaDismissed(true)}
                  className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-white"
                >
                  Để sau
                </button>
              </div>
            </div>
          )}
        </div>

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
