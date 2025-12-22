"use client";
import React, { useEffect, useState } from "react";
import { ThumbsUp, Check } from "lucide-react";
import Image from "next/image";
interface ReviewImage {
  image: string;
}
interface Review {
  reviewid: number;
  user_name: string;
  rating: number;
  review_text: string;
  review_title?: string;
  is_recommended?: boolean;
  helpful_count: number;
  created_at: string;
  images?: ReviewImage[]; 
}

const ReviewList = ({ productId }: { productId: number }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    return <p className="text-gray-500 mt-4 text-center">Chưa có đánh giá nào.</p>;

  return (
    <div className="mt-10">
      {/*  DANH SÁCH REVIEW */}
      <div className="space-y-10">
        {reviews.map((r) => (
          <div
            key={r.reviewid}
            className="flex flex-col md:flex-row justify-between border-b border-gray-200 pb-6"
          >
            {/* LEFT: Rating + Info */}
            <div className="w-full md:w-[180px] flex flex-col items-start text-sm text-gray-700 mb-3 md:mb-0">
              <span className="text-yellow-500 text-lg">
                {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
              </span>
              <span className="text-gray-400 text-xs mt-1">
                {new Date(r.created_at).toLocaleDateString("vi-VN")}
              </span>
              <span className="text-green-600 text-xs mt-1 font-medium">
                Đã mua hàng
              </span>
              {r.is_recommended && (
                <span className="text-green-600 text-xs mt-1 flex items-center">
                  <Check className="w-3 h-3 mr-1" /> Recommended
                </span>
              )}
            </div>

            {/* MIDDLE: Review content */}
            <div className="flex-1 md:px-4">
              {r.review_title && (
                <h4 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                  {r.review_title}
                </h4>
              )}
              <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                {r.review_text}
              </p>
                {/* Nếu review có hình thì hiển thị */}
                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {r.images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24">
                        <Image
                          src={img.image}
                          alt={`review-image-${idx}`}
                          fill
                          className="object-cover rounded border cursor-pointer hover:opacity-80"
                          sizes="96px"
                          onClick={() => setPreviewImage(img.image)} // mở popup
                        />
                      </div>
                    ))}
                  </div>
                )}
              

              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                <button
                  onClick={() => handleLike(r.reviewid)}
                  className="flex items-center gap-1 hover:text-red-600 transition-all"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Hữu ích ({r.helpful_count})
                </button>
              </div>
            </div>

            {/* RIGHT: User name only */}
            <div className="mt-4 md:mt-0 md:pl-6 md:border-l border-gray-200 flex items-center justify-center text-right md:min-w-[150px]">
              <p className="text-sm font-semibold text-gray-800">
                {r.user_name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/*  PHÂN TRANG */}
      <div className="flex items-center justify-center gap-4 mt-8 pb-10">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          {"<"}
        </button>
        <span className="text-sm font-medium text-gray-700">{page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded text-gray-600 hover:bg-gray-100"
        >
          {">"}
        </button>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)} // click nền để đóng
        >
          <div
            className="relative max-w-[90%] max-h-[90%]"
            onClick={(e) => e.stopPropagation()} // tránh đóng popup khi click ảnh
          >
            {/* Nút đóng */}
            <button
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-3 py-1"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>

            <Image
              src={previewImage}
              alt="Preview"
              width={900}
              height={900}
              className="object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
