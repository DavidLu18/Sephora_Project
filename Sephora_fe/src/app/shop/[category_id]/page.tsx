"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import ProductSidebarFilter from "@/components/ProductSidebarFilter"
import { Product } from "@/types/product"
// import { Category } from "@/types/category"
import { Brand } from "@/types/brand"
import { getProductsByCategory, getBrands } from "@/api"
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"

const PAGE_SIZE = 12
export default function CategoryPage() {
  const params = useParams()
  const category_id = Number(params.category_id)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [brands, setBrands] = useState<Brand[]>([])
  // const [categories] = useState<Category[]>([]) // nếu cần truyền cho sidebar
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState<{
  categoryId: number | null
  minPrice: number | null
  maxPrice: number | null
  sortBy: string
  brands: number[]
  rating: number | null
}>({
  categoryId: category_id || null,
  minPrice: null,
  maxPrice: null,
  sortBy: "",
  brands: [],
  rating: null,
})
  // 🔹 Lấy danh sách brand để hiển thị ở sidebar
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands()
        setBrands(data)
      } catch (err) {
        console.error("Lỗi khi tải brand:", err)
      }
    }
    fetchBrands()
  }, [])

  

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params: {
        category_ids: number[]
        page: number
        size: number
        min_price?: number
        max_price?: number
        rating?: number
        sort_by?: string
        brand_ids?: number[]
      } = {
        category_ids: [filters.categoryId || category_id],
        page: currentPage,
        size: PAGE_SIZE,
      }

      if (filters.minPrice) params.min_price = filters.minPrice
      if (filters.maxPrice) params.max_price = filters.maxPrice
      if (filters.rating) params.rating = filters.rating
      if (filters.sortBy) params.sort_by = filters.sortBy
      if (filters.brands.length > 0)
        params.brand_ids = filters.brands // (tuỳ API bạn có hỗ trợ không)

      const data = await getProductsByCategory(params)
      setAllProducts(data.results || [])
      setFilteredProducts(data.results || [])
      setTotalPages(Math.ceil(data.count / PAGE_SIZE))
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err)
      setError("Không thể tải danh sách sản phẩm.")
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, category_id])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // 🔹 Khi đổi filter trong sidebar
  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }))
      setCurrentPage(1)
    },
    []
  )

  if (loading)
    return (
      <main className="px-6 py-6 flex justify-center">
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </main>
    )

  if (error)
    return (
      <main className="px-6 py-6 flex justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    )

  return (
    <main className="px-24 py-8 flex gap-8">
      {/* Sidebar lọc sản phẩm */}
      <ProductSidebarFilter
        // categories={categories}
        onFilterChange={handleFilterChange}
        filters={filters}
        onClearFilters={() =>
          setFilters({
            categoryId: category_id,
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
                    const prevPage = visiblePages[idx - 1]
                    const needEllipsis = prevPage && page - prevPage > 1
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
                    )
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
          <p className="text-gray-500">Không có sản phẩm nào.</p>
        )}
      </section>
    </main>
  )
}
