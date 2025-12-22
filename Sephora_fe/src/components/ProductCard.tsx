"use client";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import WishlistModal from "@/components/WishlistModal";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { wishlistProductIds } = useWishlist();
  const liked = wishlistProductIds.includes(product.productid);

  const [showModal, setShowModal] = useState(false);

  const handleOpenWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const API_DOMAIN = "http://localhost:8000";  

  const rawImage =
    product.images?.[0] ||
    product.thumbnail ||
    "/media/products/default.jpg";

  // Nếu đường dẫn bắt đầu bằng "/" → Thêm domain
  const imageSrc =
    rawImage.startsWith("/")
      ? `${API_DOMAIN}${rawImage}`
      : rawImage;

  // -----------------------------
  const displayPrice = product.sale_price || product.price || "N/A";
  const isOnSale = product.sale_price && product.sale_price < product.price;

  const formatVND = (value: number | string | null) => {
    if (!value) return "N/A";
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const getRatingStars = (rating: number) => {
    const full = Math.floor(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  return (
    <>
      {showModal && (
        <WishlistModal
          productId={product.productid}
          onClose={() => setShowModal(false)}
        />
      )}

      <Link href={`/products/${product.productid}`} className="block">
        <div className="border rounded-lg shadow-sm p-4 hover:shadow-md transition flex flex-col h-full">

          {/* Image */}
          <div className="relative">
            <Image
              src={imageSrc}
              alt={product.product_name}
              width={192}
              height={192}
              className="rounded object-cover w-full h-48"
            />

            <button
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
              onClick={handleOpenWishlist}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  liked ? "fill-red-500 text-red-500" : "text-black"
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1 italic">
            {product.category?.category_name || "Uncategorized"}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-gray-800 line-clamp-1">
            {product.brand_name}
          </h3>

          <p className="text-sm font-medium text-gray-700 line-clamp-2 min-h-[40px]">
            {product.product_name}
          </p>

          <div className="mt-auto">
            {isOnSale && (
              <p className="text-sm text-red-400 line-through">
                {formatVND(product.price)}
              </p>
            )}
            <p className="text-lg font-semibold text-gray-900">
              {formatVND(displayPrice)}
            </p>
          </div>

          <div className="mt-1 flex items-center text-xs text-gray-500">
            {typeof product.reviews_count === "number" && product.reviews_count > 0 ? (
              <>
                <span>{product.reviews_count} Lượt đánh giá</span>
                {typeof product.avg_rating === "number" && (
                  <span className="ml-2 text-yellow-500">
                    {getRatingStars(product.avg_rating)}
                  </span>
                )}
              </>
            ) : (
              <span>Chưa có đánh giá</span>
            )}
          </div>
        </div>
      </Link>
    </>
  );
}
