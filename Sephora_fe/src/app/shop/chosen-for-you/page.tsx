"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import { Product } from "@/types/product"
// import { Category } from "@/types/category"
import ProductSidebarFilter from "@/components/ProductSidebarFilter"
import { getChosenForYou, getBrands } from "@/api"
import { Brand } from "@/types/brand"
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"

const PAGE_SIZE = 12

export default function ChosenForYouPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]) 
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]) 
  // const [categories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([]) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [filters, setFilters] = useState({
    categoryId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    sortBy: "",
    brands: [] as number[], // chứa brand_id từ sidebar
    rating: null as number | null,
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const category = searchParams.get("category")
    const brand = searchParams.getAll("brand")
    const minPrice = searchParams.get("min_price")
    const maxPrice = searchParams.get("max_price")
    const rating = searchParams.get("rating")
    const sortBy = searchParams.get("sort_by")

    setFilters({
      categoryId: category ? Number(category) : null,
      brands: brand.map(Number),
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      rating: rating ? Number(rating) : null,
      sortBy: sortBy || "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productsData, brandsData] = await Promise.all([
          getChosenForYou(),
          getBrands(),
        ])
        setAllProducts(productsData)
        setBrands(brandsData)
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu:", err)
        setError("Không thể tải danh sách sản phẩm hoặc thương hiệu.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  useEffect(() => {
    let result = [...allProducts]

    if (filters.categoryId)
      result = result.filter(
        (p) =>
          p.category &&
          Number(p.category.category_id) === Number(filters.categoryId)
      )

    if (filters.minPrice !== null)
      result = result.filter((p) => Number(p.price ?? 0) >= filters.minPrice!)
    if (filters.maxPrice !== null)
      result = result.filter((p) => Number(p.price ?? 0) <= filters.maxPrice!)


    if (filters.brands.length > 0)
      result = result.filter((p) =>
        filters.brands.some((brandId) => {
          const brand = brands.find((b) => b.brand_id === brandId)
          return (
            brand &&
            p.brand_name?.toLowerCase().trim() ===
              brand.brand_name.toLowerCase().trim()
          )
        })
      )

    if (filters.rating !== null)
      result = result.filter(
        (p) => Number(p.avg_rating ?? 0) >= (filters.rating ?? 0)
      )


    if (filters.sortBy === "sale")
      result = result.filter(
        (p) => p.sale_price && Number(p.sale_price) < Number(p.price ?? 0)
      )

    //  Sắp xếp
    if (filters.sortBy === "price-asc")
      result.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
    if (filters.sortBy === "price-desc")
      result.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
    if (filters.sortBy === "name-asc")
      result.sort((a, b) => a.product_name.localeCompare(b.product_name))
    if (filters.sortBy === "name-desc")
      result.sort((a, b) => b.product_name.localeCompare(a.product_name))

    setFilteredProducts(result)
    setCurrentPage(1)
  }, [filters, allProducts, brands])

  // Khi filters thay đổi → cập nhật URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.categoryId) params.set("category", String(filters.categoryId))
    if (filters.brands.length > 0)
      filters.brands.forEach((id) => params.append("brand", String(id)))
    if (filters.minPrice) params.set("min_price", String(filters.minPrice))
    if (filters.maxPrice) params.set("max_price", String(filters.maxPrice))
    if (filters.rating) params.set("rating", String(filters.rating))
    if (filters.sortBy) params.set("sort_by", filters.sortBy)

    const newUrl = `/shop/chosen-for-you${
      params.toString() ? `?${params.toString()}` : ""
    }`

    if (newUrl !== window.location.pathname + window.location.search) {
      router.replace(newUrl)
    }
  }, [filters, router])

  // 🔹 5️⃣ Hàm đổi filter
  const handleFilterChange = useCallback(
    (newFilters: {
      categoryId?: number | null
      minPrice?: number | null
      maxPrice?: number | null
      sortBy?: string
      brands?: number[]
      rating?: number | null
    }) => {
      setFilters((prev) => ({ ...prev, ...newFilters }))
    },
    []
  )

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const currentProducts = filteredProducts.slice(start, end)

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
      {/* Sidebar lọc */}
      <ProductSidebarFilter
        // categories={categories}
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
        <h1 className="text-2xl font-bold mb-6">Dành riêng cho bạn</h1>

        {/* Các bộ lọc đang áp dụng */}
        {(filters.brands.length > 0 ||
          filters.sortBy ||
          filters.rating ||
          filters.minPrice ||
          filters.maxPrice) && (
          <div className="flex flex-wrap gap-2 items-center mb-6 text-sm">
            {/* Rating */}
            {filters.rating && (
              <span className="flex items-center gap-1 bg-gray-100 border px-3 py-1 rounded-full">
                {filters.rating}★ trở lên
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, rating: null }))
                  }
                  className="ml-1 text-gray-500 hover:text-black"
                >
                  ×
                </button>
              </span>
            )}

            {/* Sale */}
            {filters.sortBy === "sale" && (
              <span className="flex items-center gap-1 bg-gray-100 border px-3 py-1 rounded-full">
                Sale
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, sortBy: "" }))
                  }
                  className="ml-1 text-gray-500 hover:text-black"
                >
                  ×
                </button>
              </span>
            )}

            {/* Giá bán */}
            {(filters.minPrice !== null || filters.maxPrice !== null) && (
              <span className="flex items-center gap-1 bg-gray-100 border px-3 py-1 rounded-full">
                {filters.minPrice !== null ? `$${filters.minPrice}` : "Min"} -{" "}
                {filters.maxPrice !== null ? `$${filters.maxPrice}` : "Max"}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: null,
                      maxPrice: null,
                    }))
                  }
                  className="ml-1 text-gray-500 hover:text-black"
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

        {/* Danh sách sản phẩm */}
        {currentProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {currentProducts.map((p) => (
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
