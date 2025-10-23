// src/types/order.ts

export interface OrderItem {
  orderitemid: number;
  orderid: number;
  productid: number;
  quantity: number;
  price: number;
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
