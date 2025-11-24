"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Product } from "@/types/product";

const ReviewPage = () => {
  const router = useRouter();
  // const params = useParams();
  const searchParams = useSearchParams();


  const { productId } = useParams<{ productId: string }>();

  const isEdit = searchParams.get("edit") === "true";
  const reviewId = searchParams.get("reviewid");

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<Product>();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [headline, setHeadline] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [oldImages, setOldImages] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // ✅ Mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Lấy token sau khi đã mounted (tránh SSR mismatch)
  useEffect(() => {
    if (!mounted) return;
    setToken(localStorage.getItem("token"));
  }, [mounted]);

  // ✅ Lấy thông tin sản phẩm (sau khi mounted)
  useEffect(() => {
    if (!mounted || !productId) return;
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/products/${productId}/`);
        if (!res.ok) throw new Error("Không thể tải sản phẩm.");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
      }
    })();
  }, [mounted, productId]);

  // ✅ Nếu là edit => load review cũ (chỉ khi đã có token)
  useEffect(() => {
    if (!mounted || !isEdit || !reviewId || !token) return;
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/reviews/${reviewId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Không thể tải đánh giá.");
        const data = await res.json();
        setRating(data.rating || 0);
        setHeadline(data.review_title || "");
        setReviewText(data.review_text || "");
        setOldImages(Array.isArray(data.review_images) ? data.review_images : []);
      } catch (err) {
        console.error("Lỗi khi tải review:", err);
      }
    })();
  }, [mounted, isEdit, reviewId, token]);

  // Upload ảnh
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (filesArray.length + images.length > 2) {
      alert("Chỉ được tải tối đa 2 ảnh.");
      return;
    }
    setImages((prev) => [...prev, ...filesArray]);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!rating) return alert("Vui lòng chọn số sao.");
    if (!agree) return alert("Bạn phải đồng ý điều khoản.");
    if (!token) return alert("Vui lòng đăng nhập để gửi đánh giá.");

    const formData = new FormData();
    formData.append("rating", rating.toString());
    if (reviewText) formData.append("review_text", reviewText);
    if (headline) formData.append("review_title", headline);
    images.forEach((img) => formData.append("review_images", img));

    const url = isEdit
      ? `http://127.0.0.1:8000/api/reviews/${reviewId}/`
      : `http://127.0.0.1:8000/api/products/${productId}/reviews/`;
    const method = isEdit ? "PUT" : "POST";

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Gửi đánh giá thất bại.");
      alert(isEdit ? "Đã cập nhật đánh giá!" : "Đã gửi đánh giá mới!");
      router.push("/account/orders");
    } catch (err) {
      console.error("Lỗi khi gửi:", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Chỉ chặn render sau khi đã mounted (sau tất cả hooks ở trên)
  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 my-10 shadow-sm">
      <h2 className="text-2xl font-semibold text-center mb-6">
        {isEdit ? "Chỉnh sửa đánh giá" : "Đánh giá & Nhận xét"}
      </h2>

      {/* Thông tin sản phẩm */}
      {product && (
        <div className="flex items-start gap-4 border-b pb-4 mb-4">
          <Image
            src={product.image_url || "/products/pro2.jpg"}
            alt={product.product_name}
            width={100}
            height={100}
            className="rounded-md border object-cover"
          />
          <div>
            <p className="font-semibold text-lg">{product.product_name}</p>
            {product.size && <p className="text-sm text-gray-500">{product.size}</p>}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="text-center mb-6">
        <p className="font-medium mb-2">Đánh giá sản phẩm này</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-4xl ${rating >= star ? "text-yellow-500" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Nội dung đánh giá */}
      <div className="mb-5">
        <label className="block font-medium mb-1">Nhận xét</label>
        <textarea
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Ví dụ: Sau khi sử dụng sản phẩm này được 1 tuần..."
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Tiêu đề */}
      <div className="mb-5">
        <label className="block font-medium mb-1">
          Tiêu đề <span className="text-gray-400 text-xs">(không bắt buộc)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ví dụ: Một sản phẩm không thể thiếu trong thói quen của tôi!"
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Ảnh review */}
      <div className="mb-5">
        <label className="block font-medium mb-1">
          Ảnh đánh giá <span className="text-gray-400 text-xs">(tối đa 2 ảnh)</span>
        </label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {oldImages.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20 border rounded-md overflow-hidden">
              <Image src={img} alt="old" fill className="object-cover" unoptimized />
            </div>
          ))}
          {images.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20 border rounded-md overflow-hidden">
              <Image src={URL.createObjectURL(img)} alt="upload" fill className="object-cover" unoptimized />
              <button
                onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length + oldImages.length < 2 && (
            <label className="w-20 h-20 border rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <span className="text-3xl text-gray-400">＋</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      {/* Điều khoản */}
      <div className="mb-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            Tôi đồng ý với{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Điều khoản sử dụng
            </a>
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-800">
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Đang thực hiện..." : isEdit ? "Cập nhật đánh giá" : "Xác nhận đánh giá"}
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;
