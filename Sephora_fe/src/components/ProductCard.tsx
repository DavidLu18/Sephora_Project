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

  const isOutOfStock =
    product.out_of_stock === true || (product.stock ?? 0) <= 0;

  const isExclusive = product.is_exclusive === true;
  const isDisabled = isOutOfStock || isExclusive;

  const API_DOMAIN = "http://localhost:8000";

  const rawImage =
    product.images?.[0] ||
    product.thumbnail ||
    "/media/products/default.jpg";

  const imageSrc =
    rawImage.startsWith("/") ? `${API_DOMAIN}${rawImage}` : rawImage;

  const CardContent = (
    <div
      className={`border rounded-lg shadow-sm p-4 transition flex flex-col h-full relative
        ${isDisabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}
      `}
    >
      {/* IMAGE */}
      <div className="relative">
        <Image
          src={imageSrc}
          alt={product.product_name}
          width={192}
          height={192}
          className="rounded object-cover w-full h-48"
        />

        {/* OVERLAY */}
        {isDisabled && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded z-10">
            <span className="text-white text-lg font-semibold tracking-wide">
              {isExclusive ? "NGƯNG BÁN" : "HẾT HÀNG"}
            </span>
          </div>
        )}

        {/* WISHLIST */}
        {!isDisabled && (
          <button
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md z-20"
            onClick={(e) => {
              e.preventDefault();
              setShowModal(true);
            }}
          >
            <Heart
              className={`w-5 h-5 ${
                liked ? "fill-red-500 text-red-500" : "text-black"
              }`}
            />
          </button>
        )}
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
    </div>
  );

  return (
    <>
      {showModal && (
        <WishlistModal
          productId={product.productid}
          onClose={() => setShowModal(false)}
        />
      )}

      {isDisabled ? (
        <div>{CardContent}</div>
      ) : (
        <Link href={`/products/${product.productid}`}>{CardContent}</Link>
      )}
    </>
  );
}
