"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import ProductCard from "@/components/ProductCard";
import {
  PersonalizedSearchResponse,
  submitPersonalizedFeedback,
} from "@/api";

const FEEDBACK_TAGS = [
  { value: "accurate", label: "Gợi ý sát nhu cầu" },
  { value: "too_similar", label: "Sản phẩm lặp lại" },
  { value: "out_of_budget", label: "Chưa đúng ngân sách" },
  { value: "need_more_options", label: "Muốn thêm lựa chọn" },
  { value: "language", label: "Mô tả chưa rõ ràng" },
];
import {
  loadPersonalizedResponse,
  removePersonalizedResponse,
} from "@/lib/personalizedStorage";

export default function PersonalizedSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [data, setData] = useState<PersonalizedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Thiếu session_id. Vui lòng thử lại tìm kiếm cá nhân hóa.");
      return;
    }
    const stored = loadPersonalizedResponse(sessionId);
    if (!stored) {
      setError("Phiên gợi ý đã hết hạn. Vui lòng chạy lại SephoraAI.");
      return;
    }
    setData(stored);
    if (typeof window !== "undefined") {
      const submitted = sessionStorage.getItem(`personalized-feedback:${sessionId}`) === "done";
      setFeedbackSubmitted(submitted);
    }
  }, [sessionId]);
  const toggleTag = (tag: string) => {
    setFeedbackTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleFeedbackSubmit = async () => {
    if (!sessionId) return;
    if (!feedbackRating) {
      setFeedbackError("Vui lòng chọn mức hài lòng tổng thể.");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      await submitPersonalizedFeedback({
        session_id: sessionId,
        rating: feedbackRating,
        helpful: feedbackHelpful ?? undefined,
        experience_tags: feedbackTags,
        comment: feedbackComment.trim() || undefined,
      });
      setFeedbackSubmitted(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`personalized-feedback:${sessionId}`, "done");
      }
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Không thể gửi phản hồi. Vui lòng thử lại."
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  };


  const factors = useMemo(() => data?.explanation?.factors || {}, [data]);

  const handleReset = () => {
    if (sessionId) {
      removePersonalizedResponse(sessionId);
    }
    router.push("/");
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
          <p>{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-full border border-gray-900 px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
            >
              Quay lại trang chủ
            </button>
            <button
              onClick={() => router.push("/search")}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Tìm kiếm thông thường
            </button>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <p className="text-center text-gray-600">Đang tải kết quả cá nhân hóa...</p>
      );
    }

    if (!data.results.length) {
      return (
        <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-600">
          <p>Chúng tôi chưa tìm thấy sản phẩm phù hợp với tiêu chí của bạn.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-full border border-gray-900 px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
          >
            Quay lại trang chủ
          </button>
        </div>
      );
    }

    const BUCKET_STYLES: Record<string, string> = {
      "Xuất sắc": "bg-emerald-100 text-emerald-700",
      "Rất tốt": "bg-lime-100 text-lime-700",
      "Tốt": "bg-amber-100 text-amber-700",
      "Khá": "bg-sky-100 text-sky-700",
      "Tương đối": "bg-slate-100 text-slate-600",
      "Khám phá thêm": "bg-gray-100 text-gray-600",
    };

    const fallbackLabel = (score: number) => {
      if (score >= 0.95) return "Xuất sắc";
      if (score >= 0.9) return "Rất tốt";
      if (score >= 0.8) return "Tốt";
      if (score >= 0.7) return "Khá";
      return "Tương đối";
    };

    return (
      <div className="space-y-6">
        {data.results.map((item, index) => {
          const bucketLabel =
            item.ranking?.bucket_label ?? fallbackLabel(item.scores.final);
          const badgeStyle =
            BUCKET_STYLES[bucketLabel] ?? "bg-gray-100 text-gray-600";
          const matchPercentage =
            item.match_percentage !== undefined
              ? item.match_percentage.toFixed(1)
              : (item.scores.final * 100).toFixed(1);
          const diffText =
            item.ranking &&
            (item.ranking.diff_percent >= 0
              ? `Cao hơn trung bình ${item.ranking.diff_percent}%`
              : `Thấp hơn trung bình ${Math.abs(
                  item.ranking.diff_percent
                )}%`);
          const zScoreText = item.ranking
            ? `${item.ranking.z_score >= 0 ? "+" : ""}${item.ranking.z_score}`
            : null;
          return (
          <div
              key={`${item.product.productid}-${index}`}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="w-full lg:max-w-sm">
                <ProductCard product={item.product} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">#{index + 1}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle}`}
                    >
                      {bucketLabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{matchPercentage}%</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Mức độ phù hợp
                    </p>
                    {diffText && (
                      <p className="text-xs text-gray-500">{diffText}</p>
                    )}
                    {zScoreText && (
                      <p className="text-xs text-gray-400">Z-score: {zScoreText}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>DNN: {item.scores.dnn.toFixed(3)}</p>
                    {item.scores.ncf !== null && <p>NCF: {item.scores.ncf.toFixed(3)}</p>}
                    <p>Tổng hợp: {item.scores.final.toFixed(3)}</p>
                  </div>
                </div>

                {item.reasons.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Vì sao phù hợp:</p>
                    <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                      {item.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href={`/products/${item.product.productid}`}
                  className="inline-flex items-center text-sm font-semibold text-rose-600 hover:underline"
                >
                  Khám phá chi tiết sản phẩm →
                </Link>
              </div>
            </div>
          </div>
          );
        })}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-rose-500">
                Đánh giá trải nghiệm gợi ý
              </p>
              <h2 className="text-xl font-semibold text-gray-900">
                SephoraAI có hữu ích với bạn không?
              </h2>
              <p className="text-sm text-gray-600">
                Phản hồi giúp chúng tôi tinh chỉnh mô hình nhanh hơn và ưu tiên dữ liệu phù hợp với người dùng Việt Nam.
              </p>
            </div>
            {feedbackSubmitted ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Cảm ơn bạn! Đội ngũ SephoraAI đã nhận được phản hồi cho phiên này.
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700">Mức độ hài lòng tổng thể *</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        type="button"
                        key={score}
                        onClick={() => setFeedbackRating(score)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          feedbackRating === score
                            ? "bg-black text-white"
                            : "border border-gray-300 text-gray-700"
                        }`}
                      >
                        {score}★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackHelpful(true)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      feedbackHelpful === true
                        ? "bg-emerald-600 text-white"
                        : "border border-emerald-200 text-emerald-700"
                    }`}
                  >
                    Thấy hữu ích
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackHelpful(false)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      feedbackHelpful === false
                        ? "bg-amber-500 text-white"
                        : "border border-amber-200 text-amber-700"
                    }`}
                  >
                    Cần cải thiện
                  </button>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Bạn muốn bổ sung điều gì?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FEEDBACK_TAGS.map((tag) => {
                      const active = feedbackTags.includes(tag.value);
                      return (
                        <button
                          type="button"
                          key={tag.value}
                          onClick={() => toggleTag(tag.value)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            active
                              ? "border-rose-500 bg-rose-500/10 text-rose-600"
                              : "border-gray-300 text-gray-600"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <textarea
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-700 focus:border-gray-900 focus:outline-none"
                    rows={3}
                    placeholder="Chia sẻ chi tiết hơn (ví dụ: 'muốn thêm sản phẩm bình dân', 'thiếu thương hiệu nội địa'...)"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                  />
                </div>

                {feedbackError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {feedbackError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting}
                    className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {feedbackSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                  <p className="text-xs text-gray-500">
                    Mọi phản hồi được ẩn danh theo session ID để bảo vệ quyền riêng tư.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="px-6 py-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-rose-500">
            SephoraAI Personalized
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Kết quả gợi ý cho bạn</h1>
          {data?.explanation?.summary && (
            <p className="mt-2 text-sm text-gray-600">{data.explanation.summary}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
            {factors.skin_type && (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Loại da: {factors.skin_type}
              </span>
            )}
            {factors.concerns?.length ? (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Vấn đề: {factors.concerns.join(", ")}
              </span>
            ) : null}
            {factors.age_range && (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Độ tuổi: {factors.age_range}
              </span>
            )}
          </div>
        </div>

        {renderContent()}
      </div>
    </main>
  );
}


