"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Product } from "@/types/product";
import { getProductById,addToCart  } from "@/api";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1); 

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(Number(id));
        setProduct(data);
        // Set default size if available
        if (data.size) {
          const sizes = data.size.split(",").map((s) => s.trim());
          setSelectedSize(sizes[0]?.trim());
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

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

  // Sử dụng ảnh mặc định vì API không cung cấp gallery
  const gallery = ["/products/pro2.jpg"];
  
  // Xử lý giá
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price || 0;
  const salePrice = product.sale_price ? (typeof product.sale_price === "string" ? parseFloat(product.sale_price) : product.sale_price) : null;
  const displayPrice = salePrice || price;
  const isOnSale = salePrice && price && salePrice < price;

  // Xử lý sao đánh giá
  const ratingStars = product.avg_rating
    ? "★".repeat(Math.floor(product.avg_rating)) + "☆".repeat(5 - Math.floor(product.avg_rating))
    : "☆☆☆☆☆";

  // Xử lý kích thước
  const sizes = product.size ? product.size.split(",").map((s) => s.trim()) : [];

  const handleNext = () => {
    setCurrentImage((prev) => (prev + 1) % gallery.length);
  };

  const handlePrev = () => {
    setCurrentImage((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleAddToCart = async () => {
    if (!selectedSize && sizes.length > 0) {
      alert("Vui lòng chọn kích thước!");
      return;
    }

    if (!product) return;

    try {
      await addToCart(product.productid, quantity);
      alert(" Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
    }
  };

  
  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT: Image Section */}
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

        {/* RIGHT: Product Info */}
        <div>
          <p className="text-gray-600 mb-3">{product.brand_name || "Unknown Brand"}</p>
          <h1 className="text-2xl font-bold mb-2">{product.product_name || "Unnamed Product"}</h1>
          
          {/* Rating and Like */}
          <div className="bg-gray-200  rounded-lg p-4 mb-5">
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
                    liked ? "fill-red-500 text-red-500" : "text-black"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-semibold text-red-600">
              {product.currency || "$"} {displayPrice.toFixed(2)}
            </span>
            {isOnSale && (
              <span className="text-gray-400 line-through">
                {product.currency || "$"} {price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Size Selection */}
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

          {/* Add to Basket Section (modern style) */}
          <div className="flex items-center w-full mb-6 gap-3">
            {/* Quantity Selector */}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Add to Basket Button */}
            <button
              onClick={handleAddToCart}
              className="flex flex-col justify-center items-center w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              <span className="font-semibold text-base tracking-wide">Thêm vào Giỏ hàng</span>
            </button>
          </div>

          {/* SKU */}
          <p className="text-sm text-gray-600 mt-1">SKU: {product.sku || "N/A"}</p>
        </div>  
      </div>

      {/* Highlights Section */}
      <div className="mt-10 border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">Highlights</h2>

        <div className="flex flex-wrap gap-4">
          {(product.highlight ?? []).length > 0 ? (
            product.highlight!.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 text-pink-700 text-sm font-medium"
              >
                
                {item}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">No highlights available for this product.</p>
          )}
        </div>
      </div>

      {/* About the Product Section */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">About the Product</h2>

        <p className="text-sm text-gray-500 mb-1">Item {product.sku || "N/A"}</p>
        
      </div>

      {/* Expandable Sections */}
      <div className="mt-10 border-t pt-6 space-y-4">
        <details className="group border-b pb-4">
          <summary className="flex justify-between items-center cursor-pointer font-semibold text-gray-800">
            Ingredients
            <span className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          
        </details>

        <details className="group border-b pb-4">
          <summary className="flex justify-between items-center cursor-pointer font-semibold text-gray-800">
            How to Use
            <span className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          
        </details>
      </div>

    </main>
  );
}