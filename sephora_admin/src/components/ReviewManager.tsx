"use client";

import { useEffect, useState } from "react";
import { reviewsApi, ReviewItem } from "@/api/reviews";
import Pagination from "./Pagination";
import ReviewFilter from "./ReviewFilter";

export default function ReviewManager() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    rating: "",
  });

  useEffect(() => {
    let cancel = false;

    async function fetchData() {
      const query = `?page=${page}&search=${filters.search}&rating=${filters.rating}`;
      const res = await reviewsApi.getAll(query);

      if (!cancel) {
        setItems(res.results);
        setTotal(res.total);
      }
    }

    fetchData();

    return () => {
      cancel = true;
    };
  }, [page, filters]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa review này?")) return;

    await reviewsApi.delete(id);
    setPage((p) => p);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Danh sách Review</h2>

      <ReviewFilter
        search={filters.search}
        rating={filters.rating}
        onChange={(f) => setFilters({ ...filters, ...f })}
      />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400">
            <th className="p-2 text-left">Sản phẩm</th>
            <th className="p-2 text-left">Số sao</th>
            <th className="p-2 text-left">Nội dung</th>
            <th className="p-2 text-left">Hình ảnh</th>
            <th className="p-2 text-left">Người dùng</th>
            <th className="p-2 text-right">Ngày</th>
            <th className="p-2 text-right">Xóa</th>
          </tr>
        </thead>

        <tbody>
          {items.map((r) => (
            <tr key={r.reviewid} className="border-b border-gray-800">

              <td className="p-2">
                ID: {r.product_id} — SKU: {r.product_sku}
              </td>

              <td className="p-2">{r.rating} ⭐</td>
              <td className="p-2">{r.review_text}</td>
              <td className="p-2">{r.review_images.length} ảnh</td>
              <td className="p-2">{r.user_name}</td>
              <td className="p-2 text-right">{r.created_at}</td>

              <td className="p-2 text-right">
                <button
                  onClick={() => handleDelete(r.reviewid)}
                  className="text-red-400 hover:underline"
                >
                  Xóa
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        pageSize={20}
        total={total}
        onChange={setPage}
      />
    </div>
  );
}
