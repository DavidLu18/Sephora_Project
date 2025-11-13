"use client";

import { useEffect, useState } from "react";
import { ProductQuestion } from "@/types/qa";
import {
  getQuestionsByProduct,
  createQuestion,
  markQuestionHelpful,
} from "@/api";

// ⏰ Hàm hiển thị thời gian kiểu "x days ago"
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
  const [visibleCount, setVisibleCount] = useState(1); // mặc định hiển thị 1 câu hỏi
  const showStep = 4; // mỗi lần mở thêm 4 câu hỏi
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});

  // 🔄 Load câu hỏi từ API
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

  // Gửi câu hỏi mới
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

  // Đánh dấu câu hỏi là "Hữu ích"
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

  // 🔽 Mở rộng/thu gọn câu trả lời
  const toggleAnswers = (questionId: number) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const visibleQuestions = questions.slice(0, visibleCount);

  return (
    <section className=" border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hỏi & Đáp ({questions.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 text-sm hover:underline"
        >
          Đưa ra câu hỏi
        </button>
      </div>
      {/* Form đặt câu hỏi */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-gray-200">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Nhập câu hỏi vào đây..."
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="mt-3 px-4 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800 transition"
          >
            Xác nhận
          </button>
        </div>
      )}
      <div className="grid grid-cols-12 gap-6">
        {/* Cột trái: Filter */}
        <aside className="col-span-3 hidden md:block">
          <div className=" p-4">
            {/* Sort chọn */}
            <select className=" bg-gray-100 border-none rounded-full p-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-300">
              <option value="recent">Mới nhất</option>
              <option value="helpful">Cũ nhất</option>
              <option value="answered">Nhiều trả lời nhất</option>
            </select>
          </div>
        </aside>

        {/* Cột phải: Danh sách Q&A */}
        <div className="col-span-12 md:col-span-9">
          {loading ? (
            <p className="text-gray-500 text-sm">Đang tải Q&A…</p>
          ) : questions.length === 0 ? (
            <p className="text-gray-500 italic text-sm">
              Chưa có câu hỏi nào cho sản phẩm này.
            </p>
          ) : (
            <div>
              {visibleQuestions.map((q) => (
                <div
                  key={q.id}
                  className="pb-4 mb-4 border-b border-gray-200"
                >
                  <p className="font-medium">Q: {q.content}</p>
                  <p className="text-gray-500 text-sm mb-2">
                    Đã hỏi {timeAgo(q.created_at)}
                  </p>

                  {/* Trả lời */}
                  {q.answers?.length ? (
                    <>
                      {(expandedAnswers[q.id]
                        ? q.answers
                        : q.answers.slice(0, 1)
                      ).map((a) => (
                        <div key={a.id} className="pl-5 mb-2">
                          <p>A: {a.content}</p>
                          <p className="text-gray-500 text-sm">
                            Đã trả lời {timeAgo(a.created_at)}
                          </p>
                        </div>
                      ))}
                      {q.answers.length > 1 && (
                        <button
                          onClick={() => toggleAnswers(q.id)}
                          className="text-blue-600 text-xs pl-5 hover:underline"
                        >
                          {expandedAnswers[q.id]
                            ? "Ẩn bớt câu trả lời"
                            : `Xem thêm ${q.answers.length - 1} câu trả lời`}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic pl-5 mb-2">
                      Chưa có câu trả lời nào.
                    </p>
                  )}

                  {/* Nút hành động */}
                  <div className="flex items-center text-xs text-gray-500 gap-3 pl-5 mt-1">
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

              {/* Nút Show more / Thu gọn */}
              <div className="text-left mt-4 pb-4">
                {visibleCount < questions.length ? (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + showStep, questions.length)
                      )
                    }
                    className="border border-gray-300 px-6 py-2 rounded-full text-sm hover:bg-gray-100 transition"
                  >
                    Xem thêm câu hỏi và trả lời
                  </button>
                ) : (
                  questions.length > 1 && (
                    <button
                      onClick={() => setVisibleCount(1)}
                      className="border border-gray-300 px-6 py-2 rounded-full text-sm hover:bg-gray-100 transition"
                    >
                      Thu gọn lại
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
