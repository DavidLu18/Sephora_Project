"use client";

import { useState } from "react";
import QAManager from "@/components/QAManager";
import ReviewManager from "@/components/ReviewManager";

export default function ReviewsQnAPage() {
  const [tab, setTab] = useState<"qa" | "review">("qa");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Câu hỏi & Nhận xét</h1>

      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-700 mb-6">
        <button
          onClick={() => setTab("qa")}
          className={`pb-2 ${
            tab === "qa"
              ? "text-white border-b-2 border-white"
              : "text-gray-400"
          }`}
        >
          Câu hỏi (Q&A)
        </button>

        <button
          onClick={() => setTab("review")}
          className={`pb-2 ${
            tab === "review"
              ? "text-white border-b-2 border-white"
              : "text-gray-400"
          }`}
        >
          Đánh giá (Review)
        </button>
      </div>

      {/* CONTENT SWITCH */}
      {tab === "qa" ? <QAManager /> : <ReviewManager />}
    </div>
  );
}
