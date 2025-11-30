"use client";
import { useEffect, useState , useCallback } from "react";
import {
  getWishlists,
  addToWishlist,
  removeFromWishlist,
  createWishlist,
} from "@/api";
import type { Wishlist } from "@/types/wishlist";
import { X } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

export default function WishlistModal({
  productId,
  onClose,
}: {
  productId: number;
  onClose: () => void;
}) {
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [newListName, setNewListName] = useState("");
  const { refreshWishlists } = useWishlist();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const loadLists = useCallback(async () => {
    if (!token) return;

    const data: Wishlist[] = await getWishlists(token);
    setLists(data);
    }, [token]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleAdd = async (wishlistId: number) => {
    if (!token) return;
    await addToWishlist(wishlistId, productId, token);
    await refreshWishlists();
    await loadLists();
    
  };

  const handleRemove = async (wishlistId: number) => {
    if (!token) return;
    await removeFromWishlist(wishlistId, productId, token);
    await refreshWishlists();
    await loadLists();
  };

  const handleCreate = async () => {
    if (!newListName.trim() || !token) return;
    await createWishlist(newListName.trim(), token);
    setNewListName("");
    await loadLists();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-xl w-[360px] shadow-xl relative">
        <button className="absolute right-3 top-3" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-3">My Lists</h2>

        <div className="space-y-4 max-h-64 overflow-y-auto">
          {lists.map((list) => {
            const isAdded = list.items.some(
              (item) => item.product.productid === productId
            );

            return (
              <div
                key={list.wishlistid}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className="text-sm text-gray-500">
                    {list.items.length} items
                  </p>
                </div>

                {isAdded ? (
                  <button
                    className="text-red-500 underline"
                    onClick={() => handleRemove(list.wishlistid)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="text-blue-600 underline"
                    onClick={() => handleAdd(list.wishlistid)}
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name…"
            className="border p-2 flex-1 rounded"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-2 bg-black text-white rounded-lg"
          >
            Create
          </button>
        </div>

        <button
          className="mt-4 w-full bg-gray-800 text-white py-2 rounded-lg"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
