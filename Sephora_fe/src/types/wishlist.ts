import { Product } from "./product";

export interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

export interface Wishlist {
  wishlistid: number;
  name: string;
  is_default: boolean;
  created_at: string;
  items: WishlistItem[];
}
