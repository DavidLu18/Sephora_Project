"use client";

import { useEffect, useState } from "react";
import { customersApi } from "@/api/customers";
import { Customer } from "@/types/customer";
import Link from "next/link";

export default function CustomerPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

    useEffect(() => {
    let isMounted = true;

    async function fetchData() {
        const res = await customersApi.getAll(`?search=${search}`);
        if (isMounted) {
        setItems(res.results);
        }
    }

    fetchData();

    return () => {
        isMounted = false;
    };
    }, [search]);;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Quản lý khách hàng</h1>

      {/* SEARCH */}
      <div className="flex gap-3 mb-4">
        <input
          className="bg-black/20 px-3 py-2 border border-gray-700 rounded-lg text-sm w-64"
          placeholder="Tìm theo tên, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

        {/* TABLE */}
        {/* Table wrapper */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
            <thead>
            <tr className="bg-[#1a1a1a] text-gray-300">
                <th className="p-3 border-b border-gray-800 font-medium text-left">
                Tên
                </th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">
                Email
                </th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">
                Số điện thoại
                </th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">
                Số đơn
                </th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">
                Chi tiêu
                </th>
                <th className="p-3 border-b border-gray-800 font-medium text-center w-32">
                Trạng thái
                </th>
                <th className="p-3 border-b border-gray-800 font-medium text-center w-40">
                Hành động
                </th>
            </tr>
            </thead>

            <tbody>
            {items.length === 0 ? (
                <tr>
                <td
                    colSpan={7}
                    className="p-6 text-center text-gray-500 text-sm"
                >
                    Không có khách hàng nào.
                </td>
                </tr>
            ) : (
                items.map((c) => (
                <tr
                    key={c.userid}
                    className="border-b border-gray-800 hover:bg-gray-900/40 transition"
                >
                    {/* TÊN */}
                    <td className="p-3 align-middle">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-100 line-clamp-1">
                        {c.full_name || "Chưa có tên"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                        ID: {c.userid}
                        </span>
                    </div>
                    </td>

                    {/* EMAIL */}
                    <td className="p-3 text-gray-300">{c.email}</td>

                    {/* PHONE */}
                    <td className="p-3 text-gray-300">
                    {c.phone || "—"}
                    </td>

                    {/* TOTAL ORDERS */}
                    <td className="p-3 text-gray-300">{c.total_orders}</td>

                    {/* TOTAL SPENT */}
                    <td className="p-3 text-gray-300">
                    {Number(c.total_spent).toLocaleString()}₫
                    </td>

                    {/* STATUS */}
                    <td className="p-3 text-center">
                    <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
                        c.isactive
                            ? "border-green-600 text-green-400 bg-green-600/10"
                            : "border-red-600 text-red-400 bg-red-600/10"
                        }`}
                    >
                        {c.isactive ? "Hoạt động" : "Đã khóa"}
                    </span>
                    </td>

                    {/* ACTION */}
                    <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                        <Link
                        href={`/customers/${c.userid}`}
                        className="px-3 py-1.5 text-xs rounded-lg border border-pink-500 text-pink-300 hover:bg-pink-600/20 transition"
                        >
                        Xem chi tiết
                        </Link>
                    </div>
                    </td>
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>

    </div>
  );
}
