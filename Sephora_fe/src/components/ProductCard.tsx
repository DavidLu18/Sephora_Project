"use client";
import Image from "next/image"
import Link from "next/link"
import { Product } from "@/types/product"
import { useState } from "react";
import {Heart } from "lucide-react" // Cập nhật theo thư viện mà bạn đang dùng

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  // ảnh tạm nếu backend chưa có field image
  const imageSrc = "/products/product1.jpg"

  // Nếu không có sale_price thì lấy price, nếu không có thì trả về "N/A"
  const displayPrice = product.sale_price || product.price || "N/A"
  const originalPrice = product.price ? `$${product.price}` : null
  const isOnSale = product.sale_price && product.sale_price < product.price

  // Handling ratings
  const ratingStars = product.avg_rating
    ? "★".repeat(Math.floor(product.avg_rating)) + "☆".repeat(5 - Math.floor(product.avg_rating))
    : ""

  // Logic for liked state (trạng thái yêu thích)
  const [liked, setLiked] = useState(false)

  // Hàm xử lý khi người dùng nhấn vào biểu tượng trái tim
  const handleLikeClick = () => {
    setLiked(!liked) // Chuyển đổi trạng thái liked
  }

  return (
    <Link href={`/products/${product.productid}`} className="block">
      <div className="border rounded-lg shadow-sm p-4 hover:shadow-md transition w-full">
        <div className="relative">
          <Image
            src={imageSrc}
            alt={product.product_name}
            width={192}
            height={192}
            className="rounded object-cover w-full h-48"
            style={{ height: "auto", width: "100%" }}
            priority
          />
          <button
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
            onClick={handleLikeClick} // Xử lý khi nhấn vào biểu tượng trái tim
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                liked ? "fill-red-500 text-red-500" : "text-black"
              }`}
            />
          </button>
        </div>

        <h3 className="mt-2 text-lg font-semibold truncate">{product.brand_name}</h3>
        <p className="text-sm font-medium truncate">{product.product_name}</p>

        <div className="mt-2">
          {isOnSale && originalPrice && (
            <p className="text-sm text-red-500 line-through">
              {originalPrice}
            </p>
          )}
          <p className="text-lg font-semibold">
            {product.currency ? `${product.currency} ` : "$"}
            {displayPrice}
          </p>
        </div>

        <div className="mt-1 flex items-center">
          <p className="text-xs text-gray-500">
            {product.reviews_count ?? 0} reviews
          </p>
          {product.avg_rating && (
            <span className="ml-2 text-xs">{ratingStars}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
