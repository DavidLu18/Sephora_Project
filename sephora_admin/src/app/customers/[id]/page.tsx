"use client";

import { useEffect, useState, use } from "react";
import { customersApi } from "@/api/customers";
import { CustomerDetail } from "@/types/customer";
import CustomerForm from "@/components/CustomerForm";

export default function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const customerId = Number(id);

  const [user, setUser] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await customersApi.getOne(customerId);
      if (mounted) {
        setUser(data);
        setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [customerId]);

  // 🚀 FIX: CHỈ RENDER FORM KHI DỮ LIỆU ĐÃ TẢI XONG
  if (loading || !user) {
    return <div className="p-6 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-xl font-bold">Chi tiết khách hàng</h1>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-xl">
        {/* 🚀 TRUYỀN ĐÚNG */}
        <CustomerForm data={user} />
      </div>

      {/* KHÓA / MỞ TÀI KHOẢN */}
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Trạng thái tài khoản</h2>

        <button
          className={`px-4 py-2 rounded-lg text-white ${
            user.isactive ? "bg-red-600" : "bg-green-600"
          }`}
          onClick={async () => {
            const updated = await customersApi.toggle(customerId, !user.isactive);
            setUser({ ...user, isactive: updated.is_active });
          }}
        >
          {user.isactive ? "Khóa tài khoản" : "Mở khóa"}
        </button>
      </div>
    </div>
  );
}
