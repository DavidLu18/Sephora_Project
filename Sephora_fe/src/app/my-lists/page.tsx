"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { getWishlists } from "@/api";
import { Wishlist, WishlistItem } from "@/types/wishlist";
import { useWishlist } from "@/hooks/useWishlist";
import WishlistModal from "@/components/WishlistModal";
import ProductCard from "@/components/ProductCard";
import EditWishlistModal from "@/components/EditWishlistModal";

export default function MyListsPage() {
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingList, setEditingList] = useState<Wishlist | null>(null);

  const { refreshWishlists } = useWishlist();

  //  Load lists từ API – dùng useCallback để ESLint không kêu
  const loadLists = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      const res: Wishlist[] = await getWishlists(token);
      setLists(res);
    } catch (err) {
      console.error("Failed to load wishlists:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Gom tất cả sản phẩm từ mọi list, tránh trùng product
  const allSavedItems: WishlistItem[] = Array.from(
    new Map(
      lists
        .flatMap((l) => l.items)
        .map((item) => [item.product.productid, item])
    ).values()
  );

  if (loading) {
    return <div className="p-10 text-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Tiêu đề */}
      <h1 className="text-3xl font-bold mb-6">Danh sách của tôi</h1>

      {/* Khu vực các list */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
        {lists.map((list) => (
          <div
            key={list.wishlistid}
            className="min-w-[220px] border rounded-xl p-4 shadow hover:shadow-md bg-white relative"
          >
            {/* Nút mở modal edit */}
            <button
              onClick={() => setEditingList(list)}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal size={20} />
            </button>

            {/* Thumbnail list */}
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {list.items.length > 0 ? (
                <Image
                  src={list.items[0].product.image_url || "/products/pro2.jpg"}
                  alt="thumb"
                  width={120}
                  height={120}
                  className="object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Không có sản phẩm</span>
              )}
            </div>

            {/* Click → vào trang chi tiết list */}
            <Link href={`/my-lists/${list.wishlistid}`}>
              <h3 className="mt-3 font-semibold text-lg hover:underline">
                {list.name}
              </h3>
            </Link>

            <p className="text-gray-500 text-sm">
              {list.items.length} sản phẩm
            </p>
          </div>
        ))}
      </div>

      {/* Modal Edit List (đổi tên / xóa, list default không xóa được) */}
      {editingList && (
        <EditWishlistModal
          list={editingList}
          onClose={() => setEditingList(null)}
          refresh={loadLists}
        />
      )}

      {/* Tất cả sản phẩm đã lưu trong mọi list */}
      <h2 className="text-xl font-semibold mb-4">Tất cả sản phẩm được lưu</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {allSavedItems.map((item) => {
          const p = item.product;


          return (
            <div key={item.id} className="relative">
              {/* overlay riêng cho trang My Lists */}
              <button
                onClick={() => setSelectedProduct(p.productid)}
                className="absolute top-3 right-3 bg-white p-2 rounded-full shadow z-10"
              >
              </button>

              {/* Dùng lại ProductCard cho phần khung sản phẩm */}
              <ProductCard product={p} />
            </div>
          );
        })}
      </div>

      {/* Modal chọn list để thêm / bỏ tim */}
      {selectedProduct && (
        <WishlistModal
          productId={selectedProduct}
          onClose={async () => {
            setSelectedProduct(null);
            await refreshWishlists();
            await loadLists();
          }}
        />
      )}
    </div>
  );
}
