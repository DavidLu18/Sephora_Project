export interface MonthlyRevenue {
  month: string;           // ISO date string
  total: number;           // sum(total)
}

export interface MonthlyOrders {
  month: string;           // ISO date string
  count: number;           // count(orderid)
}

export interface OrderStatusCount {
  status: string;          // "pending", "delivered", "cancelled"
  count: number;
}

export interface TopProduct {
  productid: number;
  qty: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  order_status: OrderStatusCount[];
  revenue_monthly: MonthlyRevenue[];
  orders_monthly: MonthlyOrders[];
  top_products: TopProduct[];
}