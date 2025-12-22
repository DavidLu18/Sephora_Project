"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
// import InsightRow from "@/components/InsightRow";
// import CustomerItem from "@/components/CustomerItem";
import { Search } from "lucide-react";

import { getAdminDashboardStats } from "@/api/admin";
import { DashboardStats } from "@/types/dashboard";
import { formatVND } from "@/utils/format";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getAdminDashboardStats();
        console.log("ADMIN DASHBOARD DATA:", result); 
        setData(result);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
const revenueMap: Record<string, number> = {};

if (data?.monthly_stats) {
  data.monthly_stats.forEach((m) => {
    const key = m.month; // vì đã là "2025-10" rồi, không cần date parsing
    revenueMap[key] = m.revenue;
  });
}

const chartData = data?.orders_monthly_status
  ? data.orders_monthly_status.map((item) => {
      const key = item.month.slice(0, 7); // "2025-10"

      const revenue = revenueMap[key] ?? 0;

      const orders =
        statusFilter === "all"
          ? Object.values(item.status_counts).reduce((a, b) => a + b, 0)
          : item.status_counts[statusFilter] ?? 0;

      return {
        month: `Tháng ${key.split("-")[1]}`,
        orders,
        revenue,
      };
    })
  : [];


  return (
    <div className="flex bg-[#111] text-white min-h-screen">
      <main className="flex-1 p-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-white/60 text-sm">Sephora Admin Panel</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-white/40" size={18} />
            <input
              placeholder="Search..."
              className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </header>

        {/* STAT CARDS */}
        <section className="grid grid-cols-4 gap-6 mb-10">

          {/* Tổng doanh thu (all orders) */}
          <StatCard
            label="Tổng doanh thu"
            value={formatVND(`${data?.total_revenue ?? 0} `)}
            loading={loading}
          />

          

          {/* Tổng số order */}
          <StatCard
            label="Tổng đơn hàng"
            value={data?.total_orders ?? 0}
            loading={loading}
          />

          {/* Đơn hàng giao thành công */}
          <StatCard
            label="Đơn hàng đã giao"
            value={data?.delivered_count ?? 0}
            loading={loading}
          />

          {/* Đơn hàng bị hủy */}
          <StatCard
            label="Đơn hàng đang xử lý"
            value={
              data?.order_status.find((s) => s.status === "pending")?.count ?? 0
            }
            loading={loading}
          />

          {/* Số lượng sản phẩm */}
          <StatCard
            label="Tổng sản phẩm"
            value={data?.total_products ?? 0}
            loading={loading}
          />

          {/* Sản phẩm hết hàng */}
          <StatCard
            label="Sản phẩm tạm ngưng"
            value={data?.out_of_stock_products ?? 0}
            loading={loading}
          />

          {/* Tổng brand */}
          <StatCard
            label="Số lượng thương hiệu"
            value={data?.total_brands ?? 0}
            loading={loading}
          />

          {/* Tổng category */}
          <StatCard
            label="Số lượng danh mục"
            value={data?.total_categories ?? 0}
            loading={loading}
          />

        </section>

        {/* COMBO CHART */}
        <div className="bg-white/5 p-6 mb-10 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ doanh thu & đơn hàng</h3>
          <div className="flex justify-end mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="delivered">Đã giao</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#aaa" />
                <YAxis yAxisId="left" stroke="#E31C54" />
                <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                <Tooltip />

                {/* Bar - Orders */}
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  fill="#E31C54"
                  radius={[6, 6, 0, 0]}
                />

                {/* Line - Revenue */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00C49F"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>

          {!loading &&
            (data?.top_products.length ?? 0) === 0 && (
              <p className="text-white/50 text-sm">No data yet.</p>
            )}

          {data?.top_products.map((p, index) => (
            <div
              key={p.productid}
              className="flex justify-between py-2 border-b border-white/10 text-sm"
            >
              <span>#{index + 1} — Product ID: {p.productid} — {p.product_name} </span>
              <span className="font-semibold">{p.qty} đã bán</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
