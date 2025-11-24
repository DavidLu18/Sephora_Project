"use client";

import { useState, useEffect } from "react";
import { Voucher, Campaign } from "@/types/discount";
import {
  getVouchers,
  getCampaigns,
  sendPromoNotification,
} from "@/api/discount";
import Countdown from "@/components/Countdown";

export default function DiscountsPage() {
  const [tab, setTab] = useState<"voucher" | "campaign" | "notify">("voucher");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // Fetch vouchers
  useEffect(() => {
    if (tab === "voucher") {
      getVouchers()
        .then(setVouchers)
        .catch((err) => console.error("Fetch vouchers failed:", err));
    }
  }, [tab]);

  // Fetch campaigns
  useEffect(() => {
    if (tab === "campaign") {
      getCampaigns()
        .then(setCampaigns)
        .catch((err) => console.error("Fetch campaigns failed:", err));
    }
  }, [tab]);

  const handleSendNotification = async () => {
    try {
      await sendPromoNotification({ title, message });
      alert("Đã gửi thông báo khuyến mãi!");
      setTitle("");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("Gửi thông báo thất bại");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý Khuyến mãi</h1>

      {/* Tabs */}
        <div className="flex items-center gap-10 mb-6 border-b border-gray-700">
        {/* TAB: Voucher */}
        <button
            onClick={() => setTab("voucher")}
            className={`pb-2 text-lg ${
            tab === "voucher"
                ? "text-white font-semibold border-b-2 border-white"
                : "text-gray-400"
            }`}
        >
            Mã giảm giá
        </button>

        {/* TAB: Campaign */}
        <button
            onClick={() => setTab("campaign")}
            className={`pb-2 text-lg ${
            tab === "campaign"
                ? "text-white font-semibold border-b-2 border-white"
                : "text-gray-400"
            }`}
        >
            Chương trình khuyến mãi
        </button>

        {/* TAB: Notify */}
        <button
            onClick={() => setTab("notify")}
            className={`pb-2 text-lg ${
            tab === "notify"
                ? "text-white font-semibold border-b-2 border-white"
                : "text-gray-400"
            }`}
        >
            Gửi thông báo
        </button>
    </div>

    {/* ==========================
        TAB: VOUCHERS
    ========================== */}
    {tab === "voucher" && (
    <div>
        <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Danh sách mã giảm giá</h2>
        <a
            href="/discounts/vouchers/create"
            className="px-3 py-2 bg-green-600 text-white rounded"
        >
            + Tạo mã giảm giá
        </a>
        </div>

        {/* TABLE WRAPPER */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
            <thead>
            <tr className="bg-[#1a1a1a] text-gray-300">
                <th className="p-3 border-b border-gray-800 font-medium text-left">Code</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Loại</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Giá trị</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Giới hạn</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Đã dùng</th>
            </tr>
            </thead>

            <tbody>
            {vouchers.length === 0 ? (
                <tr>
                <td
                    colSpan={5}
                    className="p-6 text-center text-gray-500 text-sm"
                >
                    Không có mã giảm giá nào.
                </td>
                </tr>
            ) : (
                vouchers.map((v) => (
                <tr
                    key={v.voucher_id}
                    className="border-b border-gray-800 hover:bg-gray-900/40 transition"
                >
                    <td className="p-3 text-gray-100">{v.code}</td>
                    <td className="p-3 text-gray-300">{v.discount_type}</td>
                    <td className="p-3 text-gray-100 font-semibold">
                    {v.discount_value}
                    </td>
                    <td className="p-3 text-gray-300">{v.usage_limit ?? "—"}</td>
                    <td className="p-3 text-gray-300">{v.used_count}</td>
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    </div>
    )}

    {/* ==========================
        TAB: CAMPAIGN (FLASH SALE)
    ========================== */}
    {tab === "campaign" && (
    <div>
        <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Chương trình khuyến mãi</h2>
        <a
            href="/discounts/campaigns/create"
            className="px-3 py-2 bg-green-600 text-white rounded"
        >
            + Tạo campaign
        </a>
        </div>

        {/* TABLE WRAPPER */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
            <thead>
            <tr className="bg-[#1a1a1a] text-gray-300">
                <th className="p-3 border-b border-gray-800 font-medium text-left">Tiêu đề</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Loại</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Bắt đầu</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Kết thúc</th>
                <th className="p-3 border-b border-gray-800 font-medium text-left">Countdown</th>
            </tr>
            </thead>

            <tbody>
            {campaigns.length === 0 ? (
                <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                    Không có campaign nào.
                </td>
                </tr>
            ) : (
                campaigns.map((c) => (
                <tr
                    key={c.campaign_id}
                    className="border-b border-gray-800 hover:bg-gray-900/40 transition"
                >
                    <td className="p-3 text-gray-100">{c.title}</td>
                    <td className="p-3 text-gray-300">{c.discount_type}</td>
                    <td className="p-3 text-gray-300">
                    {new Date(c.start_time).toLocaleString()}
                    </td>
                    <td className="p-3 text-gray-300">
                    {new Date(c.end_time).toLocaleString()}
                    </td>
                    <td className="p-3">
                    {c.is_flash_sale ? (
                        <Countdown end={c.end_time} />
                    ) : (
                        <span className="text-gray-500">—</span>
                    )}
                    </td>
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    </div>
    )}

    {/* ==========================
        TAB: GỬI THÔNG BÁO
    ========================== */}
    {tab === "notify" && (
    <div className="max-w-lg text-white">
        <h2 className="text-xl font-semibold mb-4">Gửi thông báo chương trình khuyến mãi</h2>

        <label className="block mb-2 font-medium">Tiêu đề</label>
        <input
        className="w-full border border-gray-700 bg-black p-2 rounded mb-4 text-gray-200"
        placeholder="Nhập tiêu đề..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        />

        <label className="block mb-2 font-medium">Nội dung</label>
        <textarea
        className="w-full border border-gray-700 bg-black p-2 rounded mb-4 h-28 text-gray-200"
        placeholder="Nhập nội dung..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        />

        <button
        onClick={handleSendNotification}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded"
        >
        Gửi thông báo
        </button>
    </div>
    )}

    </div>
  );
}
