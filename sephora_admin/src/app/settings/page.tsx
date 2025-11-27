"use client";

import { useEffect, useState } from "react";
import {
  getRecommendationSettings,
  updateRecommendationSettings,
  RecommendationSettings,
} from "@/api/settings";

export default function SettingsPage() {
  const [form, setForm] = useState<RecommendationSettings>({
    dnn_weight: 0.6,
    ncf_weight: 0.4,
    max_results: 10,
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRecommendationSettings();
        setForm({
          dnn_weight: data.dnn_weight,
          ncf_weight: data.ncf_weight,
          max_results: data.max_results,
        });
      } catch (error) {
        console.error(error);
        setStatus("Không thể tải cấu hình gợi ý.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof RecommendationSettings, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const saved = await updateRecommendationSettings(form);
      setForm({
        dnn_weight: saved.dnn_weight,
        ncf_weight: saved.ncf_weight,
        max_results: saved.max_results,
      });
      setStatus("Cập nhật cấu hình thành công.");
    } catch (error) {
      console.error(error);
      setStatus("Không thể cập nhật cấu hình.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">Cài đặt gợi ý</h1>
        <p className="text-white/60">
          Quản lý trọng số DNN/NCF và số lượng kết quả hiển thị trên trang người dùng.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <div>
          <label className="text-sm text-white/70">
            Trọng số DNN
            <input
              type="number"
              step="0.1"
              min={0}
              value={form.dnn_weight}
              onChange={(e) => handleChange("dnn_weight", parseFloat(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white"
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-white/70">
            Trọng số NCF
            <input
              type="number"
              step="0.1"
              min={0}
              value={form.ncf_weight}
              onChange={(e) => handleChange("ncf_weight", parseFloat(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white"
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-white/70">
            Số kết quả tối đa
            <input
              type="number"
              min={1}
              max={50}
              value={form.max_results}
              onChange={(e) => handleChange("max_results", parseInt(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white"
              disabled={loading}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white text-black font-semibold px-6 py-2 hover:bg-gray-200 transition disabled:opacity-50"
        >
          Lưu thay đổi
        </button>

        {status && <p className="text-sm text-white/80">{status}</p>}
      </form>
    </div>
  );
}


