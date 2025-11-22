"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateVoucherPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    discount_type: "",
    discount_value: "",
    min_order: "",
    max_discount: "",
    usage_limit: "",
    user_limit: "1",
    start_time: "",
    end_time: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) => {
        const target = e.target as HTMLInputElement;

        const { name, value, type } = target;

        setForm({
            ...form,
            [name]: type === "checkbox" ? target.checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const body = {
            code: form.code,
            discount_type: form.discount_type,
            discount_value: Number(form.discount_value),
            min_order: form.min_order ? Number(form.min_order) : null,
            max_discount:
                form.discount_type === "fixed"
                ? null
                : form.max_discount
                ? Number(form.max_discount)
                : null,
            usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
            user_limit: form.user_limit ? Number(form.user_limit) : 1,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            is_active: form.is_active,
            };

            const res = await fetch("http://localhost:8000/api/promotions/admin/vouchers/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
            });

            // Nếu lỗi → parse JSON để lấy lỗi chính xác
            if (!res.ok) {
            const errorData = await res.json();

            // Lấy message lỗi chính xác
            const msg =
                errorData.code?.[0] ||
                errorData.discount_type?.[0] ||
                errorData.discount_value?.[0] ||
                errorData.non_field_errors?.[0] ||
                "Đã xảy ra lỗi không xác định";

            alert("Lỗi: " + msg);
            setLoading(false);
            return;
            }

            alert("Tạo voucher thành công!");
            router.push("/discounts");

        } catch (error) {
            console.error(error);
            alert("Không thể kết nối đến server!");
        }

        setLoading(false);
    };


  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold mb-6">Tạo Voucher</h1>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-xl max-w-2xl">
        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Code */}
          <div>
            <label className="block mb-1 text-gray-300">Mã Voucher</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block mb-1 text-gray-300">Loại giảm giá</label>
            <select
              name="discount_type"
              value={form.discount_type}
              onChange={handleChange}
              required
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            >
              <option value="">-- Chọn loại --</option>
              <option value="percent">Giảm theo %</option>
              <option value="fixed">Giảm số tiền</option>
            </select>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block mb-1 text-gray-300">Giá trị giảm</label>
            <input
              name="discount_value"
              value={form.discount_value}
              onChange={handleChange}
              required
              type="number"
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            />
          </div>

          {/* Min order */}
          <div>
            <label className="block mb-1 text-gray-300">
              Đơn tối thiểu (min_order)
            </label>
            <input
              name="min_order"
              value={form.min_order}
              onChange={handleChange}
              type="number"
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            />
          </div>

          {/* Max discount */}
          <div>
            <label className="block mb-1 text-gray-300">
              Giảm tối đa (cho %)
            </label>
            <input
              name="max_discount"
              value={form.max_discount}
              onChange={handleChange}
              type="number"
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            />
          </div>

          {/* Usage limit */}
          <div>
            <label className="block mb-1 text-gray-300">
              Giới hạn lượt dùng (usage_limit)
            </label>
            <input
              name="usage_limit"
              value={form.usage_limit}
              onChange={handleChange}
              type="number"
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            />
          </div>

          {/* User limit */}
          <div>
            <label className="block mb-1 text-gray-300">
              Mỗi user được dùng bao nhiêu lần (user_limit)
            </label>
            <input
              name="user_limit"
              value={form.user_limit}
              onChange={handleChange}
              type="number"
              className="w-full bg-black border border-gray-700 p-2 rounded text-gray-200"
            />
          </div>

          {/* Start time */}
          <div>
            <label className="block mb-1 text-gray-300">Ngày bắt đầu</label>
            <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                className="w-full bg-[#0d0d0d] border border-gray-800 p-2 rounded-lg text-gray-200 focus:border-pink-500 focus:ring-pink-500 transition"
            />
          </div>

          {/* End time */}
          <div>
            <label className="block mb-1 text-gray-300">Ngày kết thúc</label>
            <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                className="w-full bg-[#0d0d0d] border border-gray-800 p-2 rounded-lg text-gray-200 focus:border-pink-500 focus:ring-pink-500 transition"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label className="text-gray-300">Kích hoạt voucher</label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
          >
            {loading ? "Đang tạo..." : "Tạo voucher"}
          </button>

        </form>
      </div>
    </div>
  );
}
