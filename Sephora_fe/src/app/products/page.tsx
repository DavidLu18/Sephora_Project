"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Product } from "@/types/product"
import { getProductsByCategory } from "@/api"
import ProductCard from "@/components/ProductCard"

export default function CategoryPage() {
  const params = useParams()
  const category_id = Number(params.category_id)  // ✅ Lấy param từ URL

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!category_id) return
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await getProductsByCategory({
          category_ids: [category_id],
          page,
        })
        setProducts(data.results) // DRF pagination format
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err)
        setError("Không thể tải sản phẩm")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category_id, page])

  if (loading) return <p>Đang tải sản phẩm...</p>
  if (error) return <p>{error}</p>
  console.log("🔄 Category ID hiện tại:", category_id)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh mục {category_id}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.productid} product={p} />
          
        ))}
      </div>
      <div className="flex justify-center mt-6 gap-3">
        <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
          Trang trước
        </button>
        <span>Trang {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Trang sau</button>
      </div>
    </div>
  )
}
