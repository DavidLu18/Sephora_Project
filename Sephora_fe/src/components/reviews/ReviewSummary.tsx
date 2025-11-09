"use client";
import React from "react";
import { Star } from "lucide-react";

interface Review {
  rating: number;
  is_recommended?: boolean;
}

interface ReviewSummaryProps {
  reviews: Review[];
}

export default function ReviewSummary({ reviews }: ReviewSummaryProps) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-500 mt-4">Chưa có đánh giá nào.</p>;
  }

  const total = reviews.length;
  const average =
    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total;

  
  // Tính số lượng sao
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / total) * 100,
  }));

  return (
    <section className="pt-10 pb-8 bg-white ">
      <div className="max-w-5xl mx-auto">
        {/* Tiêu đề */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Đánh giá & nhận xét ({total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total})
        </h2>
        <a href="#" className="text-blue-600 text-sm hover:underline">
          Viết nhận xét
        </a>

        <div className="flex flex-col md:flex-row justify-between mt-6">
          {/* LEFT - Summary */}
          <div className="w-full md:w-1/3">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Đánh giá</h3>
            <div className="space-y-2">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{star}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-black rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER + RIGHT trống để sau này thêm nội dung */}
          <div className="w-full md:w-2/3 flex flex-col md:flex-row justify-between items-start md:items-center mt-6 md:mt-0">
            {/* Trung bình sao */}
            {/* Trung bình sao */}
            <div className="flex flex-col items-start ml-4">
              <div className="flex items-center gap-2"> {/* tăng từ gap-1 -> gap-2 */}
                <span className="text-4xl font-bold text-gray-900 leading-none">
                  {average.toFixed(1)}
                </span>
                <Star className="w-6 h-6 text-black fill-black mt-[2px]" /> {/* to hơn 1 chút, đẩy nhẹ xuống cho cân hàng */}
              </div>
              <span className="text-sm text-gray-500 mt-2">
                {total.toLocaleString()} Lượt nhận xét*
              </span>
            </div>


            
          </div>
        </div>
      </div>
    </section>
  );
}
