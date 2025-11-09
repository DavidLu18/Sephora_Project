"use client";
import React, { useState } from "react";

const ReviewForm = ({
  productId,
  onSubmitSuccess,
}: {
  productId: number;
  onSubmitSuccess: () => void;
}) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(
      `http://127.0.0.1:8000/api/products/${productId}/reviews/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review_title: title,
          review_text: text,
          is_recommended: true,
        }),
      }
    );

    if (res.ok) {
      setRating(5);
      setText("");
      setTitle("");
      onSubmitSuccess();
      alert("Cảm ơn bạn đã đánh giá!");
    } else {
      alert("Gửi đánh giá thất bại!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded-lg bg-white mt-6">
      <h3 className="font-semibold text-lg mb-2">Viết đánh giá</h3>

      <label className="block mb-1">Điểm đánh giá (1–5 sao)</label>
      <input
        type="number"
        min="1"
        max="5"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="border rounded p-1 w-16 mb-3"
      />

      <input
        placeholder="Tiêu đề đánh giá"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded p-2 w-full mb-2"
      />

      <textarea
        placeholder="Chia sẻ trải nghiệm của bạn..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="border rounded p-2 w-full mb-2"
        rows={4}
      />

      <button
        type="submit"
        className="mt-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Gửi đánh giá
      </button>
    </form>
  );
};

export default ReviewForm;
