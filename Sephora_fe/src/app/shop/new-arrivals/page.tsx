import { getNewArrivals, getCategories } from "@/api"
import ProductCard from "@/components/ProductCard"
import Link from "next/link"
import { Product } from "@/types/product"
import { Category } from "@/types/category"
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"

const PAGE_SIZE = 12

export default async function NewArrivalsPage(props: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const searchParams = await props.searchParams
  const currentPage = Number(searchParams.page) || 1
  const selectedCategory = searchParams.category
    ? Number(searchParams.category)
    : null

  // Lấy dữ liệu
  const [allProducts, categories]: [Product[], Category[]] = await Promise.all([
    getNewArrivals(200),
    getCategories(),
  ])

  // 🔹 Lọc sản phẩm theo danh mục (nếu có)
  const filteredProducts = selectedCategory
    ? allProducts.filter(
        (p) =>
          p.category &&
          Number(p.category.category_id) === Number(selectedCategory)
      )
    : allProducts

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)

  // Phân trang
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const products = filteredProducts.slice(start, end)

  return (
    <main className="px-24 py-8 flex gap-8">
      {/* Sidebar danh mục */}
      <aside className="w-48">
        <Link
          href="/shop/new-arrivals"
          className="font-bold mb-3 block hover:underline"
        >
          Sản phẩm mới
        </Link>

        {categories.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {categories.map((cat) => (
              <li key={cat.category_id}>
                <Link
                  href={`/shop/new-arrivals?category=${cat.category_id}`}
                  className={`hover:underline ${
                    selectedCategory === cat.category_id
                      ? "font-semibold text-black"
                      : "text-gray-700"
                  }`}
                >
                  {cat.category_name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Không có danh mục</p>
        )}
      </aside>

      {/* Danh sách sản phẩm */}
      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Sản phẩm mới</h1>

        {products.length === 0 ? (
          <p className="text-gray-600">Không có sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.productid} product={p} />
            ))}
          </div>
        )}

        {/* Phân trang rút gọn */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 text-sm">
            {currentPage > 1 && (
              <>
                <Link
                  href={`/shop/new-arrivals?page=1${
                    selectedCategory ? `&category=${selectedCategory}` : ""
                  }`}
                  className="p-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                >
                  <ChevronsLeft size={18} />
                </Link>
                <Link
                  href={`/shop/new-arrivals?page=${
                    currentPage - 1
                  }${selectedCategory ? `&category=${selectedCategory}` : ""}`}
                  className="p-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                >
                  <ChevronLeft size={18} />
                </Link>
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
                    <Link
                      href={`/shop/new-arrivals?page=${page}${
                        selectedCategory ? `&category=${selectedCategory}` : ""
                      }`}
                      className={`px-3 py-1 rounded border ${
                        page === currentPage
                          ? "bg-black text-white border-black"
                          : "hover:bg-gray-100 border-gray-300"
                      }`}
                    >
                      {page}
                    </Link>
                  </span>
                )
              })}

            {currentPage < totalPages && (
              <>
                <Link
                  href={`/shop/new-arrivals?page=${
                    currentPage + 1
                  }${selectedCategory ? `&category=${selectedCategory}` : ""}`}
                  className="p-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                >
                  <ChevronRight size={18} />
                </Link>
                <Link
                  href={`/shop/new-arrivals?page=${totalPages}${
                    selectedCategory ? `&category=${selectedCategory}` : ""
                  }`}
                  className="p-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                >
                  <ChevronsRight size={18} />
                </Link>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
