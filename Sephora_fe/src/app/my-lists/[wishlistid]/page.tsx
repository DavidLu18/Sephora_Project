"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getWishlists } from "@/api";
import { Wishlist,  } from "@/types/wishlist";
import ProductCard from "@/components/ProductCard";
import WishlistModal from "@/components/WishlistModal";
import EditWishlistModal from "@/components/EditWishlistModal";
import { useWishlist } from "@/hooks/useWishlist";

import Link from "next/link";

export default function WishlistDetailPage() {
  const { wishlistid } = useParams();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingList, setEditingList] = useState<Wishlist | null>(null);

  const { refreshWishlists } = useWishlist();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🔄 Load đúng wishlist theo ID
  const loadWishlist = useCallback(async () => {
    if (!token) return;

    const lists: Wishlist[] = await getWishlists();
    const found = lists.find(
      (l) => l.wishlistid === Number(wishlistid)
    );

    setWishlist(found || null);
    setLoading(false);
  }, [wishlistid, token]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  if (loading) {
    return <div className="p-10 text-center">Đang tải...</div>;
  }

  if (!wishlist) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold mb-2">List not found</h1>
        <Link href="/my-lists" className="underline text-blue-500">
          Quay lại My Lists
        </Link>
      </div>
    );
  }

  const items = wishlist.items;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* 🔙 Back */}
      <Link
        href="/my-lists"
        className="text-sm text-gray-500 underline mb-4 inline-block"
      >
        &larr; Quay lại danh sách của tôi
      </Link>

      {/* 🏷 Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{wishlist.name}</h1>
          <p className="text-gray-500 mt-1">
            {items.length} sản phẩm{items.length !== 1 }
          </p>
        </div>

        {/* Edit list */}
        <button
          onClick={() => setEditingList(wishlist)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* ❗ Nếu list trống */}
      {items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Danh sách này chưa có sản phẩm nào.</p>
          <Link
            href="/"
            className="px-5 py-3 bg-black text-white rounded-lg inline-block"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      )}

      {/* Grid sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {items.map((item) => {
          const p = item.product;
          
          return (
            <div key={item.id} className="relative">
              {/* ❤️ overlay */}
              <button
                onClick={() => setSelectedProduct(p.productid)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 shadow z-10"
              >
                
              </button>

              {/* ProductCard */}
              <ProductCard product={p} />
            </div>
          );
        })}
      </div>

      {/* Modal chọn list */}
      {selectedProduct && (
        <WishlistModal
          productId={selectedProduct}
          onClose={async () => {
            setSelectedProduct(null);
            await refreshWishlists();
            await loadWishlist();
          }}
        />
      )}

      {/* Modal edit list */}
      {editingList && (
        <EditWishlistModal
          list={editingList}
          onClose={() => setEditingList(null)}
          refresh={loadWishlist}
        />
      )}
    </div>
  );
}
