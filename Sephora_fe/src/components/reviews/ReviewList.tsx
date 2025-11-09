"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";

interface Review {
  reviewid: number;
  user_name: string;
  rating: number;
  review_text: string;
  review_title?: string;
  review_images?: string[];
  is_recommended?: boolean;
  helpful_count: number;
  created_at: string;
}

const ReviewList = ({ productId }: { productId: number }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/products/${productId}/reviews/?page=${page}`)
      .then((res) => res.json())
      .then(setReviews)
      .catch(() => console.error("Không tải được danh sách đánh giá"));
  }, [productId, page]);

  const handleLike = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/api/reviews/${id}/like/`, {
      method: "PATCH",
    });
    setReviews((prev) =>
      prev.map((r) =>
        r.reviewid === id ? { ...r, helpful_count: r.helpful_count + 1 } : r
      )
    );
  };

  if (reviews.length === 0)
    return <p className="text-gray-500 mt-4">Chưa có đánh giá nào.</p>;

  return (
    <div className="mt-8 space-y-8">
      {reviews.map((r) => (
        <div
          key={r.reviewid}
          className="flex flex-col md:flex-row justify-between  pb-6"
        >
          {/* LEFT - Content */}
          <div className="flex-1 pr-4">
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <span className="text-yellow-400 text-lg">
                {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
              </span>
              <span className="text-gray-400 text-sm ml-1">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Title */}
            {r.review_title && (
              <h3 className="font-semibold text-gray-900 mb-1">
                {r.review_title}
              </h3>
            )}

            {/* Review text */}
            <p className="text-gray-700 text-sm whitespace-pre-line mb-3">
              {r.review_text}
            </p>

            {/* Recommended */}
            {r.is_recommended && (
              <div className="flex items-center text-green-600 text-sm mb-2">
                <Check className="w-4 h-4 mr-1" /> Recommended
              </div>
            )}

            {/* Images */}
            {r.review_images && r.review_images.length > 0 && (
              <div className="flex gap-3 mt-2">
                {r.review_images.map((img, i) => (
                  <Image
                    key={i}
                    src={img}
                    alt="review-img"
                    width={80}
                    height={80}
                    className="rounded-md border object-cover"
                  />
                ))}
              </div>
            )}

            {/* Helpful actions */}
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
              <button
                onClick={() => handleLike(r.reviewid)}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <ThumbsUp className="w-4 h-4" /> Helpful ({r.helpful_count})
              </button>
              <div className="flex items-center gap-1 text-gray-400">
                <ThumbsDown className="w-4 h-4" /> (0)
              </div>
            </div>
          </div>

          {/* RIGHT - User info */}
          <div className="flex flex-col items-center mt-4 md:mt-0 min-w-[120px]">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
              {r.user_name?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="text-sm font-medium text-gray-800 mt-2">
              {r.user_name}
            </p>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          {"<"}
        </button>
        <span className="text-sm text-gray-600">Trang {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          {">"}
        </button>
      </div>
    </div>
  );
};

export default ReviewList;
