// src/app/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { getAllProducts } from "@/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <main className="px-6 py-10 flex justify-center">
        <p className="text-gray-600">Loading products...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-6 py-10 flex justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>

      {/* Grid hiển thị nhiều sản phẩm */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {products.length > 0 ? (
          products.map((p) => (
            <ProductCard key={p.productid} product={p} />
          ))
        ) : (
          <p className="text-gray-500">No products found.</p>
        )}
      </div>
    </main>
  );
}
