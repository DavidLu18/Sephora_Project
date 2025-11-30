"use client";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { Heart } from "lucide-react";
import { useState } from "react";

// Wishlist hooks & modal
import { useWishlist } from "@/hooks/useWishlist";
import WishlistModal from "@/components/WishlistModal";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const imageSrc = product.image_url || "/products/pro2.jpg";

  // ⭐ Lấy danh sách product ID đã được thích
  const { wishlistProductIds } = useWishlist();
  const liked = wishlistProductIds.includes(product.productid);

  // ⭐ Hiển thị modal
  const [showModal, setShowModal] = useState(false);

  const handleOpenWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // không cho click vào Link
    setShowModal(true);
  };

  const displayPrice = product.sale_price || product.price || "N/A";
  const originalPrice = product.price ? `$${product.price}` : null;
  const isOnSale = product.sale_price && product.sale_price < product.price;

  const getRatingStars = (rating: number) => {
    const full = Math.floor(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  const ratingStars = getRatingStars(product.avg_rating || 0);
  const lowestCategory = product.category?.category_name || "Uncategorized";

  const formatVND = (value: number | string | null) => {
    if (!value) return "N/A";
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  return (
    <>
      {/* ⭐ Popup Wishlist */}
      {showModal && (
        <WishlistModal
          productId={product.productid}
          onClose={() => setShowModal(false)}
        />
      )}

      <Link href={`/products/${product.productid}`} className="block">
        <div className="border rounded-lg shadow-sm p-4 hover:shadow-md transition flex flex-col h-full">
          <div className="relative">
            <Image
              src={imageSrc}
              alt={product.product_name}
              width={192}
              height={192}
              className="rounded object-cover w-full h-48"
            />

            {/* ⭐ Nút Trái Tim */}
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

          {/* Category */}
          <p className="text-xs text-gray-500 mt-1 italic">{lowestCategory}</p>

          {/* Brand */}
          <h3 className="mt-2 text-lg font-semibold text-gray-800 line-clamp-1">
            {product.brand_name}
          </h3>

          {/* Product name */}
          <p className="text-sm font-medium text-gray-700 line-clamp-2 min-h-[40px]">
            {product.product_name}
          </p>

          {/* Giá */}
          <div className="mt-auto">
            {isOnSale && originalPrice && (
              <p className="text-sm text-red-400 line-through">
                {formatVND(originalPrice)}
              </p>
            )}
            <p className="text-lg font-semibold text-gray-900">
              {formatVND(displayPrice)}
            </p>
          </div>

          {/* Đánh giá */}
          <div className="mt-1 flex items-center text-xs text-gray-500">
            {product.reviews_count && product.reviews_count > 0 ? (
              <>
                <span>{product.reviews_count} Lượt đánh giá</span>
                {product.avg_rating ? (
                  <span className="ml-2 text-yellow-500">
                    {ratingStars}
                  </span>
                ) : null}
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
