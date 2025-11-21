export interface OrderItem {
  orderitemid: number;
  productid: number;
  product_name: string;
  image: string;
  quantity: number;
  price: number;
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
}
