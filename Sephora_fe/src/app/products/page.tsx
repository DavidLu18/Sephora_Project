// src/app/products/page.tsx
"use client";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product"

const allProducts: Product[] = [
  {
    id: 1,
    name: "Shark Glossi™ 2-in-1 Hot Tool",
    price: 179,
    image: "/products/prod1.jpg",
    reviews: 123,
  },
  {
    id: 2,
    name: "Summer Fridays Lip Butter Balm Minis",
    price: 25,
    image: "/products/prod2.jpg",
    reviews: 87,
  },
  {
    id: 3,
    name: "Sol de Janeiro Perfume Mist",
    price: 39,
    image: "/products/prod3.jpg",
    reviews: 215,
  },
  {
    id: 4,
    name: "Sephora Favorites Holiday Set",
    price: 69,
    image: "/products/prod4.jpg",
    reviews: 45,
  },
  {
    id: 5,
    name: "Tower 28 Beauty LipSoftie",
    price: 20,
    image: "/products/prod5.jpg",
    reviews: 64,
  },
  {
    id: 6,
    name: "Saie Mini Dew Blush",
    price: 30,
    image: "/products/prod6.jpg",
    reviews: 92,
  },
]

export default function ProductsPage() {
  return (
    <main className="px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>

      {/* Grid hiển thị nhiều sản phẩm */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {allProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
