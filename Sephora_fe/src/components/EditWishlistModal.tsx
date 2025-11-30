"use client";

import { useState } from "react";
import { renameWishlist, deleteWishlist } from "@/api";
import { Wishlist } from "@/types/wishlist";
import { X, Trash2, Save } from "lucide-react";

export default function EditWishlistModal({
  list,
  onClose,
  refresh,
}: {
  list: Wishlist;
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState(list.name);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleRename = async () => {
    if (!token) return;
    await renameWishlist(list.wishlistid, name, token);
    refresh();
    onClose();
  };

  const handleDelete = async () => {
    if (!token) return;
    if (list.is_default) {
      alert("Không thể xóa wishlist mặc định!");
      return;
    }
    await deleteWishlist(list.wishlistid, token);
    refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl w-[350px] shadow-xl relative">
        <button className="absolute right-3 top-3" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Chỉnh sửa</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border w-full p-2 rounded mb-4"
        />

        <div className="flex justify-between mt-4">
          <button
            onClick={handleRename}
            className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2"
          >
            <Save size={18} />
            Lưu
          </button>

          {!list.is_default && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
            >
              <Trash2 size={18} />
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
