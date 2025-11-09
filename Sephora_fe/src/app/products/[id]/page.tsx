"use client";
import React from "react";
import { useEffect, useState, useCallback  } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { getProductById, addToCart } from "@/api";
import ProductQA from "@/components/ProductQA";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import ReviewList from "@/components/reviews/ReviewList";
// import ReviewForm from "@/components/reviews/ReviewForm";

// 🧱 Kiểu dữ liệu cho review
export interface Review {
  id: number;
  user_name: string;
  rating: number;
  review_text: string;
  helpful_count: number;
  created_at: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(Number(id));
        setProduct(data);
        if (data.size) {
          const sizes = data.size.split(",").map((s) => s.trim());
          setSelectedSize(sizes[0]);
        }
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);


  const fetchReviews = useCallback(async () => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/products/${id}/reviews/`);
    if (!res.ok) throw new Error("Không tải được đánh giá");
    const data = await res.json();
    setReviews(data);
  } catch (err) {
    console.error("Lỗi khi tải đánh giá:", err);
  }
}, [id]);

  useEffect(() => {
    if (id) fetchReviews();
  }, [id,fetchReviews]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Không tìm thấy sản phẩm.
      </div>
    );
  }

  const gallery = ["/products/pro2.jpg"];
  const price =
    typeof product.price === "string"
      ? parseFloat(product.price)
      : product.price || 0;
  const salePrice = product.sale_price
    ? typeof product.sale_price === "string"
      ? parseFloat(product.sale_price)
      : product.sale_price
    : null;
  const displayPrice = salePrice || price;
  const isOnSale = salePrice && price && salePrice < price;
  const ratingStars = product.avg_rating
    ? "★".repeat(Math.floor(product.avg_rating)) +
      "☆".repeat(5 - Math.floor(product.avg_rating))
    : "☆☆☆☆☆";
  const sizes = product.size ? product.size.split(",").map((s) => s.trim()) : [];

  const handleNext = () =>
    setCurrentImage((prev) => (prev + 1) % gallery.length);
  const handlePrev = () =>
    setCurrentImage((prev) =>
      prev === 0 ? gallery.length - 1 : prev - 1
    );

  const handleAddToCart = async () => {
    if (!selectedSize && sizes.length > 0) {
      alert("Vui lòng chọn kích thước!");
      return;
    }
    if (!product) return;

    try {
      await addToCart(product.productid, quantity);
      window.dispatchEvent(new Event("cartUpdated"));
      alert("Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
    }
  };

  const USD_TO_VND = 25000; // bạn có thể đổi tỉ giá theo nhu cầu

  const convertToVND = (usdValue: number | string | null | undefined) => {
    if (!usdValue) return "N/A";
    const value = Number(usdValue) * USD_TO_VND;
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };
  const getCategoryPath = (category: Category): { category_id: number; category_name: string }[] => {
    const path: { category_id: number; category_name: string }[] = [];
    let current: Category | null | undefined = category;
    while (current) {
      path.unshift({
        category_id: current.category_id,
        category_name: current.category_name,
      });
      current = current.parent;
      
    }
    return path;
  };

  
  return (
    <main className="min-h-screen bg-white px-6 pb-10 md:px-20">
      <div className="max-w-6xl mx-auto">
        {product.category && (
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap items-center mt-4">
        {getCategoryPath(product.category).map((cat, index, arr) => (
          <React.Fragment key={`cat-${cat.category_id}`}>
            <span className="hover:underline cursor-pointer">
              {cat.category_name}
            </span>
            {index < arr.length - 1 && (
              <span key={`sep-${cat.category_id}`} className="mx-2 text-gray-400">
                {">"}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    )}
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT: IMAGE */}  
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-full">
            <Image
              src={gallery[currentImage]}
              alt={product.product_name || "Product Image"}
              width={500}
              height={500}
              className="rounded-xl object-cover w-full h-auto transition-all duration-300"
            />
            {gallery.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div>
          <p className="text-gray-600 mb-3">
            {product.brand_name || "Unknown Brand"}
          </p>
          <h1 className="text-2xl font-bold mb-2">
            {product.product_name || "Unnamed Product"}
          </h1>

          <div className="bg-gray-200 rounded-lg p-4 mb-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-800">
              <span className="text-lg text-black">
                {ratingStars} {product.avg_rating?.toFixed(1) || "0.0"}
              </span>
              <span className="font-semibold">
                {product.reviews_count || 0} reviews
              </span>
              <button
                onClick={() => setLiked(!liked)}
                className="flex items-center gap-1 focus:outline-none"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    liked
                      ? "fill-red-500 text-red-500"
                      : "text-black"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* PRICE */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-semibold text-red-600">
              {convertToVND(displayPrice)}
            </span>
            {isOnSale && (
              <span className="text-gray-400 line-through">
                {convertToVND(price)}
              </span>
            )}
          </div>

          {/* SIZE */}
          {sizes.length > 0 && (
            <div className="mb-5">
              <p className="text-sm text-gray-600 mb-2">Kích thước:</p>
              <div className="flex gap-3 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 rounded-lg border text-base font-medium transition-all ${
                      selectedSize === size
                        ? "bg-white text-black border-black font-bold"
                        : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADD TO CART */}
          <div className="flex items-center w-full mb-6 gap-3">
            <div className="relative">
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 text-gray-800 font-medium text-sm rounded-lg px-4 py-2 pr-8 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex flex-col justify-center items-center w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              <span className="font-semibold text-base tracking-wide">
                Thêm vào Giỏ hàng
              </span>
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            SKU: {product.sku || "N/A"}
          </p>
        </div>
      </div>

      {/* Highlights Section */} 
      <div className="mt-10 border-t pt-8"> 
        <h2 className="text-lg font-semibold mb-4">Danh mục nổi bật</h2> 
        <div className="flex flex-wrap gap-4"> 
          {(product.highlight ?? []).length > 0 ? ( product.highlight!.map((item, index) => ( 
            <div key={index} className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 text-pink-700 text-sm font-medium" > 
              {item} 
            </div> )) ) : ( <p className="text-sm text-gray-400 italic">Không có danh mục nổi bật thuộc sản phẩm này.</p> )} 
        </div> 
      </div>

      {/* About the Product Section */} 
      <div className="mt-10 border-t  pt-6"> 
        <h2 className="text-lg font-semibold mb-4">Thông tin sản phẩm</h2> 
        <p className="text-sm text-gray-500 mb-1">Item {product.sku || "N/A"}</p> 
      </div> 
      {/* Expandable Sections */} 
      <div className="mt-10 border-t pt-6 space-y-4"> 
        <details className="group border-b pb-4"> 
          <summary className="flex justify-between items-center cursor-pointer font-semibold text-gray-800"> Thành phần <span className="transition-transform group-open:rotate-180">⌄</span> 
            </summary> 
        </details> 
        <details className="group border-b pb-4"> 
          <summary className="flex justify-between items-center cursor-pointer font-semibold text-gray-800"> Hướng dẫn sử dụng <span className="transition-transform group-open:rotate-180">⌄</span> 
        </summary> 
        </details>
        </div>

      {/* Q&A */}
      <div className="mt-10  pt-8">
        <ProductQA productId={Number(id)} />
      </div>

      {/* 🧠 ĐÁNH GIÁ & NHẬN XÉT */}
      <div className="mt-12  pt-8">
        <h2 className="text-lg font-semibold mb-4">Đánh giá sản phẩm</h2>
        <ReviewSummary reviews={reviews} />
        {/* <ReviewForm
          productId={Number(id)}
          onSubmitSuccess={fetchReviews}
        /> */}
        <ReviewList productId={Number(id)} />
      </div>
    </main>
  );
}
