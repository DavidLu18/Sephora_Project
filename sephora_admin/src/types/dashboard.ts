export interface MonthlyRevenue {
  month: string;     // ISO date string
  total: number;     // Sum(total)
}
export interface MonthlyOrderStatus {
  status: string;   // ví dụ: "pending", "delivered", "cancelled"
  count: number;
}
export interface MonthlyOrders {
  month: string;     // ISO date string
  count: number;     // Count(orderid)
  status_counts: MonthlyOrderStatus[];
}

export interface OrderStatusCount {
  status: string;    // "pending", "delivered", "cancelled", ...
  count: number;
}

export interface TopProduct {
  productid: number;
  qty: number;
  product_name?: string;
  brand_name?: string;
  category_name?: string;
  image?: string | null;
}

export interface DashboardStats {
  // --- Existing fields ---
  total_revenue: number;
  total_orders: number;
  order_status: OrderStatusCount[];
  orders_monthly_status: MonthlyOrderStatus[]; 
  revenue_monthly: MonthlyRevenue[];
  orders_monthly: MonthlyOrders[];
  top_products: TopProduct[];

  // --- New fields added in backend ---
  delivered_revenue: number;       // NEW
  delivered_count: number;         // NEW

  total_products: number;          // NEW
  out_of_stock_products: number;   // NEW
  total_brands: number;            // NEW
  total_categories: number;      
    monthly_stats: {
    month: string;      // "2025-10"
    orders: number;     // số đơn trong tháng
    revenue: number;    // doanh thu trong tháng
  }[];  // NEW
}

export interface MonthlyStatusCount {
  [status: string]: number; // pending, delivered, cancelled, processing...
}

export interface MonthlyOrderStatus {
  month: string;         // ISO string
  status_counts: MonthlyStatusCount;
}