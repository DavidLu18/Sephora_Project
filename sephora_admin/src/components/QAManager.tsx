"use client";

import { useEffect, useState } from "react";
import { qnaApi, QAItem } from "@/api/qna";
import Pagination from "./Pagination";
import QAFilter from "./QAFilter";

export default function QAManager() {
  const [items, setItems] = useState<QAItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    answered: "",
 });

    useEffect(() => {
    let cancel = false;

    async function fetchData() {
        const query = `?page=${page}&search=${filters.search}&answered=${filters.answered}`;
        const res = await qnaApi.getAll(query);

        // Nếu backend trả array → res là array
        // Nếu backend trả object → dùng res.results
        const list = Array.isArray(res) ? res : res.results ?? [];
        const count = res.total ?? list.length;

        if (!cancel) {
        setItems(list);
        setTotal(count);
        }
    }

    fetchData();

    return () => {
        cancel = true;
    };
    }, [page, filters]);


  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;

    await qnaApi.delete(id);

    // Trigger reload lại bằng cách giữ nguyên page
    setPage((prev) => prev);
  };

  const reply = async (id: number) => {
    const text = prompt("Nhập câu trả lời:");
    if (!text) return;

    await qnaApi.answer(id, text);

    // Trigger reload lại
    setPage((prev) => prev);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Câu hỏi sản phẩm</h2>

      <QAFilter
        search={filters.search}
        answered={filters.answered}
        onChange={(newFilter) =>
          setFilters({ ...filters, ...newFilter })
        }
      />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400">
            <th className="p-2 text-left">Sản phẩm</th>
            <th className="p-2 text-left">Câu hỏi</th>
            <th className="p-2 text-left">Ngày</th>
            <th className="p-2 text-right">Hành động</th>
          </tr>
        </thead>

        <tbody>
          {items.map((q) => (
            <tr key={q.id} className="border-b border-gray-800">
              <td className="p-2">
                <span className="text-gray-400">
                    {" "}
                    (ID: {q.product_id} – SKU: {q.product_sku})
                </span>
              </td>
              <td className="p-2">{q.content}</td>
              <td className="p-2">{q.created_at}</td>


              <td className="p-2 text-right">
                {/* Xóa */}
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-red-400 hover:underline mr-3"
                >
                  Xóa
                </button>

                {/* Trả lời */}
                {q.status === "pending" && (
                  <button
                    onClick={() => reply(q.id)}
                    className="text-blue-400 hover:underline"
                  >
                    Trả lời
                  </button>
                )}
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
