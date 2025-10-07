// app/products/[id]/page.tsx
"use client"
import { use } from "react"
import { products } from "@/data/products"
import { Product } from "@/types/product"
import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Heart } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default function ProductDetail({ params }: Props) {
  const { id } = use(params)
  const product: Product | undefined = products.find(
    (p) => p.id === Number(id)
  )

  const [selectedSize, setSelectedSize] = useState<string | null>(
    product?.sizes?.find((s) => s.selected)?.label || null
  )

  const [currentImage, setCurrentImage] = useState(0)
  const [liked, setLiked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsPerPage = 5

  // an toàn với undefined
  

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Product not found.
      </div>
    )
  }
  const userReviews = product.userReviews ?? []
  const totalPages = Math.ceil(userReviews.length / reviewsPerPage)
  const paginatedReviews = userReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  )

  const gallery = product.gallery || [product.image]

  
  const handleNext = () => {
    setCurrentImage((prev) => (prev + 1) % gallery.length)
  }

  const handlePrev = () => {
    setCurrentImage((prev) =>
      prev === 0 ? gallery.length - 1 : prev - 1
    )
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT: Image + Gallery */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 order-2 md:order-1">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-16 h-16 border rounded-lg overflow-hidden ${
                  currentImage === i
                    ? "border-black"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>

          {/* Main Image with arrows */}
          <div className="relative order-1 md:order-2">
            <Image
              src={gallery[currentImage]}
              alt={product.name}
              width={500}
              height={500}
              className="rounded-xl object-cover transition-all duration-300"
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
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-3">{product.subtitle}</p>

          <div className="bg-gray-50 border rounded-lg p-4 mb-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-800 mb-1">
            {/* Stars */}
            <span className="text-lg text-black">★★★★☆</span>
            <span className="font-semibold">{product.reviews.toLocaleString()} reviews</span>
            <span className="text-gray-400">|</span>
            <button className="text-blue-600 hover:underline">Ask a question</button>
            <span className="text-gray-400">|</span>
            {/* Heart */}
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-1 focus:outline-none"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  liked ? "fill-red-500 text-red-500" : "text-black"
                }`}
              />
              <span className="font-medium text-gray-700">104.6K</span>
            </button>
          </div>

          {/* Subtext */}
          <p className="text-xs text-gray-600">
            Highly rated by customers for:
            <span className="text-blue-600 ml-1 hover:underline cursor-pointer">satisfaction</span>,{" "}
            <span className="text-blue-600 hover:underline cursor-pointer">softness</span>,{" "}
            <span className="text-blue-600 hover:underline cursor-pointer">smell</span>
          </p>
        </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-semibold text-red-600">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="mb-6">
            <p className="font-medium mb-2">Size:</p>
            <div className="flex flex-wrap gap-3">
              {product.sizes?.map((size, i) => {
                const isSelected = selectedSize === size.label
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(size.label)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? " text-black border-black "
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <select className="border rounded-lg px-3 py-2 text-sm">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition">
              Add to Basket
            </button>
           <button
              onClick={() => setLiked(!liked)}
              className="p-3 border rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label="Add to favorites"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  liked ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
              />
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Sign in or create an account to enjoy FREE standard shipping.
          </p>
        </div>
      </div>
      {/* ---------- About the Product ---------- */}
      <section className="max-w-6xl mx-auto mt-10 border-t pt-6 px-2 md:px-0">
        <div className="mt-10 ">
          <h2 className="text-xl font-semibold mb-4">About the Product</h2>

          <div className="space-y-2 text-sm text-gray-800">
            <p>
              <span className="text-gray-500 mr-2">Item:</span>
              {product.id || "None!!"}
            </p>

            <p>
              <span className="font-semibold">What it is:</span>{" "}
              {product.description || "None!!"}
            </p>

            <p>
              <span className="font-semibold">Hair Type:</span>{" "}
              {product.hairType || "None!!"}
            </p>

            <p>
              <span className="font-semibold">Hair Texture:</span>{" "}
              {product.hairTexture || "None!!"}
            </p>

            <button className="text-blue-600 text-sm hover:underline mt-2">
              Show more
            </button>
          </div>
        </div>

        {/* ---------- Ingredients ---------- */}
        <div className="border-t pt-6 ">
          <details>
            <summary className="font-semibold cursor-pointer text-lg">
              Ingredients
            </summary>
            <p className="mt-3 text-sm text-gray-700">
              {product.ingredients || "None!!"}
            </p>
          </details>
        </div>

        {/* ---------- How to Use ---------- */}
        <div className="border-t pt-6 mt-4 mb-10">
          <details>
            <summary className="font-semibold cursor-pointer text-lg">
              How to Use
            </summary>
            <p className="mt-3 text-sm text-gray-700">
              {product.howToUse || "None!!"}
            </p>
          </details>
        </div>
      </section>

      {/* ---------- Ratings & Reviews ---------- */}
      <section id="reviews-section" className="max-w-6xl mx-auto mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold mb-6">
          Ratings & Reviews ({product.reviews.toLocaleString()})
        </h2>

        {/* Summary */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 mb-8">
          <div className="flex-1">
            <p className="text-4xl font-semibold">
              {product.averageRating ?? "0.0"}★
            </p>
            <p className="text-gray-600">{product.reviews.toLocaleString()} Reviews</p>
            <p className="mt-2 text-sm text-gray-600">
              {product.recommendedPercent ?? 0}% Recommended
            </p>
          </div>

          {/* Pros / Cons */}
          <div className="flex-1 grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Pros Mentioned</h4>
              {product.pros?.length ? (
                <ul className="space-y-1 text-sm text-gray-700">
                  {product.pros.map((p, i) => (
                    <li key={i} className="border px-2 py-1 rounded-lg w-fit">
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None!!</p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">Cons Mentioned</h4>
              {product.cons?.length ? (
                <ul className="space-y-1 text-sm text-gray-700">
                  {product.cons.map((c, i) => (
                    <li key={i} className="border px-2 py-1 rounded-lg w-fit">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None!!</p>
              )}
            </div>
          </div>
        </div>

        {/* Review Images */}
        {product.reviewImages && product.reviewImages.length > 0 && (
          <div className="mb-8">
            <h4 className="font-medium mb-3">Images from reviews</h4>
            <div className="flex gap-3 overflow-x-auto">
              {product.reviewImages.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`review-${i}`}
                  width={120}
                  height={120}
                  className="rounded-md object-cover border"
                />
              ))}
            </div>
          </div>
        )}

        {/* Individual Reviews */}
        <div className="space-y-6">
          {userReviews.length > 0 ? (
            <>
              {paginatedReviews.map((r) => (
                <div
                  key={r.id}
                  className="border-t pt-4 flex flex-col md:flex-row gap-4"
                >
                  <div className="flex-shrink-0">
                    <p className="font-medium">{r.author}</p>
                    <p className="text-xs text-gray-500">{r.date}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-yellow-500 text-sm">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </p>
                    <p className="text-gray-800 text-sm mt-1">{r.comment}</p>
                    {r.image && (
                      <Image
                        src={r.image}
                        alt="review"
                        width={100}
                        height={100}
                        className="mt-2 rounded-md border object-cover"
                      />
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                      <span>Helpful? 👍 {r.helpful ?? 0}</span>
                      <span>👎 {r.notHelpful ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {/* Prev */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 text-sm rounded ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-black hover:text-red-600"
                  }`}
                >
                  &lt;
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => {
                        setCurrentPage(pageNumber)
                        document
                          .getElementById("reviews-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        currentPage === pageNumber
                          ? "bg-black text-white"
                          : "text-black hover:text-red-600"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                {/* Dấu … + Trang cuối */}
                {totalPages > 6 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => {
                        setCurrentPage(totalPages)
                        document
                          .getElementById("reviews-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        currentPage === totalPages
                          ? "bg-black text-white"
                          : "text-black hover:text-red-600"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 text-sm rounded ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-black hover:text-red-600"
                  }`}
                >
                  &gt;
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
        </div>
      </section>
    </main>
  )
}
