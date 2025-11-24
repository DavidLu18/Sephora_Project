"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import { Product } from "@/types/product"
import { Category } from "@/types/category"

import { getAllProducts, getCategories } from "@/api"
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"

const PAGE_SIZE = 12

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    categoryId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    sortBy: "",
  })

  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter()
  const selectedCategory = searchParams.get("category")

  // 🔹 Lấy dữ liệu sản phẩm & danh mục
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getAllProducts(),
          getCategories(),
        ])
        setProducts(productData)
        setCategories(categoryData)
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu:", err)
        setError("Không thể tải danh sách sản phẩm hoặc danh mục.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 🔹 Khi thay đổi danh mục trên URL → cập nhật filter.categoryId
  useEffect(() => {
    if (selectedCategory) {
      setFilters((prev) => ({
        ...prev,
        categoryId: Number(selectedCategory),
      }))
    } else {
      setFilters((prev) => ({ ...prev, categoryId: null }))
    }
  }, [selectedCategory])


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

  // 🔹 Áp dụng bộ lọc
  let filteredProducts = [...products]

  if (filters.categoryId)
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.category &&
        Number(p.category.category_id) === Number(filters.categoryId)
    )

  if (filters.minPrice !== null)
  filteredProducts = filteredProducts.filter(
    (p) => p.price && Number(p.price) >= filters.minPrice!
  )

  if (filters.maxPrice !== null)
    filteredProducts = filteredProducts.filter(
      (p) => p.price && Number(p.price) <= filters.maxPrice!
    )

  if (filters.sortBy === "price-asc")
    filteredProducts.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))

  if (filters.sortBy === "price-desc")
    filteredProducts.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
  if (filters.sortBy === "name-asc")
  filteredProducts.sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )

  if (filters.sortBy === "name-desc")
    filteredProducts.sort((a, b) =>
      b.product_name.localeCompare(a.product_name)
  )
  //  Phân trang
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const currentProducts = filteredProducts.slice(start, end)

  return (
    <main className="px-24 py-8 flex gap-8">
      {/* Sidebar lọc sản phẩm (có cuộn riêng) */}
      {/* <ProductSidebarFilter
              categories={categories}
              onFilterChange={handleFilterChange}
              filters={filters} // ✅ truyền filters xuống sidebar
              onClearFilters={() => {
                setFilters({
                  categoryId: null,
                  minPrice: null,
                  maxPrice: null,
                  sortBy: "",
                  // brands: [],
                  rating: null,
                })
              }} // ✅ khi sid
            /> */}

      {/* Danh sách sản phẩm */}
      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Tất cả sản phẩm</h1>

        {currentProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {currentProducts.map((p) => (
                <ProductCard key={p.productid} product={p} />
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 text-sm">
                {currentPage > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="p-2 border rounded hover:bg-gray-100"
                      aria-label="Trang đầu"
                    >
                      <ChevronsLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="p-2 border rounded hover:bg-gray-100"
                      aria-label="Trang trước"
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
                      aria-label="Trang sau"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-2 border rounded hover:bg-gray-100"
                      aria-label="Trang cuối"
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
