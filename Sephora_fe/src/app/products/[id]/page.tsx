// app/products/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { Product } from "@/types/product"
import { getProductById } from "@/api"

export default function ProductDetail() {
  const { id } = useParams() // ✅ Next.js 13+ hook để lấy param từ URL
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(Number(id))
        setProduct(data)
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Product not found.
      </div>
    )
  }

  // Ảnh tạm thời (vì backend chưa có image)
  const gallery = ["/images/default-product.jpg"]

  const handleNext = () => {
    setCurrentImage((prev) => (prev + 1) % gallery.length)
  }

  const handlePrev = () => {
    setCurrentImage((prev) =>
      prev === 0 ? gallery.length - 1 : prev - 1
    )
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT: Image */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative order-1 md:order-2">
            <Image
              src={gallery[currentImage]}
              alt={product.product_name}
              width={500}
              height={500}
              className="rounded-xl object-cover transition-all duration-300"
            />
            {gallery.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.product_name}</h1>
          <p className="text-gray-600 mb-3">{product.brand_name}</p>

          <div className="bg-gray-50 border rounded-lg p-4 mb-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-800 mb-1">
              <span className="text-lg text-black">
                ⭐ {product.avg_rating?.toFixed(1) ?? "0.0"}
              </span>
              <span className="font-semibold">
                {product.reviews_count ?? 0} reviews
              </span>
              <span className="text-gray-400">|</span>
              <button
                onClick={() => setLiked(!liked)}
                className="flex items-center gap-1 focus:outline-none"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    liked ? "fill-red-500 text-red-500" : "text-black"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-semibold text-red-600">
              {product.currency ? `${product.currency} ` : "$"}
              {product.sale_price || product.price}
            </span>
            {product.sale_price && product.price && (
              <span className="text-gray-400 line-through">
                {product.currency ? `${product.currency} ` : "$"}
                {product.price}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-4">
            {product.description || "No description available."}
          </p>
        </div>
      </div>
    </main>
  )
}
