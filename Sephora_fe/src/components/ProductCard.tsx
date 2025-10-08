import Image from "next/image"
import Link from "next/link"
import { Product } from "@/types/product"

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  // ảnh tạm nếu backend chưa có field image
  const imageSrc = "/products/product1.jpg"

  // dùng sale_price nếu có, ngược lại lấy price
  const displayPrice = product.sale_price || product.price || "N/A"

  return (
    <Link href={`/products/${product.productid}`} className="block">
      <div className="border rounded-lg shadow-sm p-3 hover:shadow-md transition w-full">
        <Image
          src={imageSrc}
          alt={product.product_name}
          width={192}
          height={192}
          className="rounded object-cover w-full h-48"
          style={{ height: "auto", width: "100%" }}
          priority  
        />
        <h3 className="mt-2 text-sm font-semibold truncate">{product.product_name}</h3>

        <p className="text-gray-700">
          {product.currency ? `${product.currency} ` : "$"}
          {displayPrice}
        </p>

        <p className="text-xs text-gray-500">
          {product.reviews_count ?? 0} reviews{" "}
          {product.avg_rating && (
            <span className="ml-1">⭐ {product.avg_rating.toFixed(1)}</span>
          )}
        </p>
      </div>
    </Link>
  )
}
