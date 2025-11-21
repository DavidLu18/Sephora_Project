"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getAdminOrderDetail,
  updateAdminOrderStatus,
} from "@/api/orders";
import { AdminOrder } from "@/types/orders";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);

  useEffect(() => {
    getAdminOrderDetail(Number(id)).then(setOrder);
  }, [id]);

  const changeStatus = async (s: string) => {
    const updated = await updateAdminOrderStatus(Number(id), s);
    setOrder(updated);
  };

  if (!order) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="space-y-10">

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-white">Đơn hàng #{order.orderid}</h1>
        <p className="text-gray-400">Chi tiết đơn hàng và các thao tác quản trị</p>
      </div>

      {/* ORDER SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CUSTOMER */}
        <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-400 mb-1">Khách hàng</h3>
          <p className="text-lg font-medium text-white">{order.user_email}</p>
        </div>

        {/* TOTAL PRICE */}
        <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-400 mb-1">Tổng tiền</h3>
          <p className="text-xl font-bold text-pink-500">{order.total}đ</p>
        </div>

        {/* STATUS */}
        <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-400 mb-1">Trạng thái đơn</h3>

          <select
            value={order.status}
            onChange={(e) => changeStatus(e.target.value)}
            className="
              mt-2 w-full
              bg-[#1a1a1a] border border-white/10 
              text-gray-200 px-4 py-2 rounded-lg focus:outline-none
              focus:border-pink-600 transition
            "
          >
            <option value="pending">Chờ xử lý</option>
            <option value="shipping">Đang vận chuyển</option>
            <option value="delivered">Đã nhận hàng</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

      </div>

      {/* STATUS TIMELINE */}
      <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-white mb-4">Tiến trình đơn hàng</h2>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {[
            { key: "pending", label: "Chờ xử lý" },
            { key: "shipping", label: "Đang giao" },
            { key: "delivered", label: "Hoàn tất" },
            { key: "cancelled", label: "Đã hủy" },
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${order.status === step.key 
                    ? "bg-pink-600 text-white shadow-lg shadow-pink-500/30" 
                    : "bg-[#222] text-gray-400"
                  }
                `}
              >
                {idx + 1}
              </div>
              <p className="mt-2 text-gray-300">{step.label}</p>
            </div>
          ))}

        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="bg-[#0f0f0f] p-6 border border-white/10 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-white mb-6">Danh sách sản phẩm</h2>

        <div className="space-y-6">

          {order.items.map((item) => (
            <div
              key={item.orderitemid}
              className="flex items-center justify-between border-b border-white/10 pb-5"
            >

              <div className="flex items-center gap-4">

                <div className="w-16 h-16 rounded-lg bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-gray-500">
                  IMG
                </div>

                <div>
                  <p className="font-medium text-white">{item.product_name}</p>
                  <p className="text-gray-400 text-sm">Số lượng: {item.quantity}</p>
                </div>

              </div>

              <p className="text-pink-400 font-semibold text-lg">
                {item.price}đ
              </p>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}
