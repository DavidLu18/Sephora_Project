export interface OrderItem {
  orderitemid: number;
  productid: number;
  product_name: string;
  image: string;
  quantity: number;
  price: number;
}
export interface OrderAddress {
  street: string | null;
  district: string | null;
  city: string;
  country: string;
  zipcode: string | null;
}
export interface AdminOrder {
  orderid: number;
  userid: number;
  user_email: string;
  total: number;
  status: string;
  payment_method: string;
  shipping_method: string;
  createdat: string;
  updatedat: string;
  items: OrderItem[];
  phone?: string; // NEW
  address?: OrderAddress | null; // NEW
  voucher?: OrderVoucher | null;
}
export interface OrderVoucher {
  voucher_code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  discount_amount: number;
  used_time: string | null;
}