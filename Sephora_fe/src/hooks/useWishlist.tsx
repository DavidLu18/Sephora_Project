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
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Đánh dấu đã đọc xong localStorage
  useEffect(() => {
    setAuthReady(true);
  }, []);

  const refreshWishlists = async (): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishlistProductIds([]);
      return;
    }

    try {
      const lists: Wishlist[] = await getWishlists();
      const ids = new Set<number>();

      lists.forEach((list) => {
        list.items.forEach((item) => {
          ids.add(item.product.productid);
        });
      });

      setWishlistProductIds(Array.from(ids));
    } catch (err) {
      // err có thể là object { status, response } do fetchAPI throw
      if (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        (err as { status: number }).status === 401
      ) {
        localStorage.removeItem("token");
        setWishlistProductIds([]);
      }

      console.error("Wishlist load error:", err);
    }
  };

  // Chỉ gọi wishlist khi auth đã sẵn sàng + có token
  useEffect(() => {
    if (!authReady) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    refreshWishlists();
  }, [authReady]);

  return (
    <WishContext.Provider value={{ wishlistProductIds, refreshWishlists }}>
      {children}
    </WishContext.Provider>
  );
}

export const useWishlist = (): WishContextType => useContext(WishContext);
