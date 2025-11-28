"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
// import InsightRow from "@/components/InsightRow";
// import CustomerItem from "@/components/CustomerItem";
import { Search } from "lucide-react";

import { getAdminDashboardStats } from "@/api/admin";
import { DashboardStats } from "@/types/dashboard";

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

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getAdminDashboardStats();
        setData(result);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = data
    ? data.revenue_monthly.map((item, index) => ({
        month: new Date(item.month).toLocaleString("en-US", { month: "short" }),
        revenue: item.total,
        orders: data.orders_monthly[index]?.count ?? 0,
      }))
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
          <StatCard
            label="Total Revenue"
            value={`$${data?.total_revenue ?? 0}`}
            loading={loading}
          />

          <StatCard
            label="Total Orders"
            value={data?.total_orders ?? 0}
            loading={loading}
          />

          <StatCard
            label="Delivered Orders"
            value={
              data?.order_status.find((s) => s.status === "delivered")?.count ?? 0
            }
            loading={loading}
          />

          <StatCard
            label="Cancelled Orders"
            value={
              data?.order_status.find((s) => s.status === "cancelled")?.count ?? 0
            }
            loading={loading}
          />
        </section>

        {/* COMBO CHART */}
        <div className="bg-white/5 p-6 mb-10 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Revenue & Orders</h3>

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
              <span>#{index + 1} — Product ID: {p.productid}</span>
              <span className="font-semibold">{p.qty} sold</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
