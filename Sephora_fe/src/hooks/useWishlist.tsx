"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getWishlists } from "@/api";
import type { Wishlist } from "@/types/wishlist";

interface WishContextType {
  wishlistProductIds: number[];
  refreshWishlists: () => Promise<void>;
}

const WishContext = createContext<WishContextType>({
  wishlistProductIds: [],
  refreshWishlists: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);

  const refreshWishlists = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const lists: Wishlist[] = await getWishlists(token);
      const ids = new Set<number>();

      lists.forEach((list) => {
        list.items.forEach((item) => {
          ids.add(item.product.productid);
        });
      });

      setWishlistProductIds(Array.from(ids));
    } catch (err) {
      console.error("Wishlist load error:", err);
    }
  };

  useEffect(() => {
    refreshWishlists();
  }, []);

  return (
    <WishContext.Provider value={{ wishlistProductIds, refreshWishlists }}>
      {children}
    </WishContext.Provider>
  );
}

export const useWishlist = () => useContext(WishContext);
