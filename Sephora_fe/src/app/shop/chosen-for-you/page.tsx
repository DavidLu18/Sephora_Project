"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import { Product } from "@/types/product"
import { Category } from "@/types/category"
import { getChosenForYou, getCategories } from "@/api"
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 12

export default function ChosenForYouPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedCategory = searchParams.get("category")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getChosenForYou(200),
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

  // 🔹 Lọc sản phẩm theo danh mục (nếu có)
  const filteredProducts = selectedCategory
  ? products.filter(
      (p) =>
        p.category &&
        String(p.category.category_id) === selectedCategory
    )
  : products

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const currentProducts = filteredProducts.slice(start, end)

  return (
    <main className="px-24 py-8 flex gap-8">
      {/* 🔹 Sidebar danh mục bên trái */}
      <aside className="w-48">
        <Link
          href="/shop/chosen-for-you"
          className="font-bold mb-3 block hover:underline"
        >
          Chosen For You
        </Link>

        {categories.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {categories.map((cat) => (
              <li key={cat.category_id}>
                <button
                  onClick={() =>
                    router.push(`/shop/chosen-for-you?category=${cat.category_id}`)
                  }
                  className={`text-left w-full hover:underline ${
                    String(cat.category_id) === selectedCategory
                      ? "font-semibold text-black"
                      : "text-gray-700"
                  }`}
                >
                  {cat.category_name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Không có danh mục</p>
        )}
      </aside>

      {/* 🔹 Danh sách sản phẩm */}
      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Dành riêng cho bạn</h1>

        {currentProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {currentProducts.map((p) => (
                <ProductCard key={p.productid} product={p} />
              ))}
            </div>

            {/* 🔹 Phân trang (rút gọn) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 text-sm">
                {/* Trang đầu & trước */}
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

                {/* Các số trang (rút gọn) */}
                {Array.from({ length: totalPages })
                  .map((_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                  })
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

                {/* Trang sau & cuối */}
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
