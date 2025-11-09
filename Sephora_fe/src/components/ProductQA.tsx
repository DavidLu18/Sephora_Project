"use client";

import { useEffect, useState } from "react";
import { ProductQuestion } from "@/types/qa";
import {
  getQuestionsByProduct,
  createQuestion,
  markQuestionHelpful,
} from "@/api";

// Hàm tính thời gian dạng "x days ago"
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export default function ProductQA({ productId }: { productId: number }) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  // 🧩 Tải danh sách câu hỏi
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const data: ProductQuestion[] = await getQuestionsByProduct(productId);
        setQuestions(data);
      } catch (error) {
        console.error("Lỗi khi tải câu hỏi:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [productId]);

  // 🧩 Gửi câu hỏi mới (ẩn danh)
  const handleSubmit = async () => {
    if (!questionText.trim()) return;
    try {
      const newQuestion = await createQuestion(productId, questionText.trim());
      setQuestions((prev) => [newQuestion, ...prev]);
      setQuestionText("");
      setShowForm(false);
    } catch (error) {
      console.error("Lỗi khi gửi câu hỏi:", error);
      alert("Không thể gửi câu hỏi. Vui lòng thử lại!");
    }
  };

  // 🧩 Đánh dấu hữu ích
  const handleHelpful = async (id: number) => {
    try {
      const { helpful_count } = await markQuestionHelpful(id);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, helpful_count } : q))
      );
    } catch (error) {
      console.error("Lỗi khi đánh dấu hữu ích:", error);
    }
  };

  // 🧩 Pagination
  const startIdx = (page - 1) * pageSize;
  const paginated = questions.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(questions.length / pageSize);

  return (
    <section className="mt-14 border-t border-b-2 pt-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Hỏi & Đáp ({questions.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 text-sm hover:underline"
        >
          Đưa ra câu hỏi
        </button>
      </div>

      {/* Form hỏi */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Nhập câu hỏi vào đây..."
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="mt-2 px-4 py-2 bg-white text-black rounded-lg text-sm hover:bg-gray-200 border"
          >
            Xác nhận
          </button>
        </div>
      )}

      {/* Danh sách câu hỏi */}
      {loading ? (
        <p className="text-gray-500 text-sm">Đang tải Q&A…</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500 italic text-sm">
          Chưa có câu hỏi nào cho sản phẩm này. Hãy là người đầu tiên đặt câu hỏi!
        </p>
      ) : (
        <div>
          {paginated.map((q) => (
           <div
              key={q.id}
              className="pb-5 mb-5 relative after:content-[''] after:block after:h-[1px] after:bg-gray-200 after:mt-5"
            >
              <p className="font-semibold">Q: {q.content}</p>
              <p className="text-gray-500 text-sm mb-2">
                Đã hỏi {timeAgo(q.created_at)}
              </p>

              {/* Trả lời */}
              {q.answers?.length ? (
                q.answers.map((a) => (
                  <div key={a.id} className="pl-5 mb-2">
                    <p className="">A: {a.content}</p>
                    <p className="text-gray-500 text-sm">
                      Đã trả lời {timeAgo(a.created_at)} 
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic pl-5 mb-2">
                  Chưa có câu trả lời nào.
                </p>
              )}

              {/* Nút hành động */}
              <div className="flex items-center text-xs text-gray-500 gap-3 pl-5">
                <button
                  onClick={() => handleHelpful(q.id)}
                  className="hover:underline"
                >
                  Hữu ích? △
                </button>
                <span>({q.helpful_count || 0})</span>
                <button className="hover:underline text-blue-600">
                  Trả lời câu hỏi này.
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-2 py-1 rounded ${
                page === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-200"
              }`}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  page === i + 1
                    ? "bg-black text-white"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-2 py-1 rounded ${
                page === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-200"
              }`}
            >
              &gt;
            </button>
          </div>

          <div className="text-center mt-6">
            <button className="border px-5 py-2 rounded-full text-sm hover:bg-gray-100">
              Show more Questions & Answers
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
