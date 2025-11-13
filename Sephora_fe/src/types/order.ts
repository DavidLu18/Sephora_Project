// src/types/order.ts
export interface UserReview {
  reviewid: number;
  rating: number;
  review_title?: string;
  review_text?: string;
  review_images?: string[];
  is_recommended?: boolean;
  submission_time?: string;
}
export interface OrderItem {
  orderitemid: number;
  orderid: number;
  productid: number;
  quantity: number;
  price: number;

  product_name?: string;
  brand_name?: string;
  category_name?: string;
  product_image?: string;

  user_review?: UserReview | null;
}

export interface Order {
  orderid: number;
  userid: number;
  addressid: number | null;
  total: number;
  status: string;
  payment_method: string;
  shipping_method: string | null;
  createdat: string;
  updatedat: string;
  items: OrderItem[];
}
