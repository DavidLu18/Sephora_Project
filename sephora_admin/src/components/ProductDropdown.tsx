"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/types";

interface ProductDropdownProps {
  selected: number[];
  onChange: (values: number[]) => void;
}

export default function ProductDropdown({ selected, onChange }: ProductDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [hasNext, setHasNext] = useState(false);

  /* ------------------------------------------
      LOAD PAGE — async inside useEffect
  ------------------------------------------- */
  useEffect(() => {
    if (!open) return; // chỉ load khi dropdown mở

    let isCancelled = false;

    const fetchProducts = async () => {
      const r = await fetch(
        `http://localhost:8000/api/products/?search=${search}&page=${page}&size=10`
      );

      const json = await r.json();

      if (!isCancelled) {
        setProducts(json.results ?? []);
        setHasNext(json.next !== null);
      }
    };

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [open, search, page]);

  /* ------------------------------------------
      SELECT TOGGLE
  ------------------------------------------- */
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="mb-4">
      <p className="text-gray-300 mb-1">Chọn sản phẩm</p>

      <div
        className="bg-black border border-gray-700 p-2 rounded cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0
          ? "— Chưa chọn —"
          : `${selected.length} sản phẩm đã chọn`}
      </div>

      {open && (
        <div className="mt-2 bg-[#1a1a1a] border border-gray-800 p-3 rounded max-h-80 overflow-y-auto">
          {/* Search */}
          <input
            className="w-full bg-black border border-gray-700 p-2 rounded mb-2"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // reset trang về 1 khi đổi search
            }}
          />

          {/* Danh sách sản phẩm */}
          {products.map((p) => (
            <label key={p.productid} className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={selected.includes(p.productid)}
                onChange={() => toggle(p.productid)}
              />
              {p.product_name}
            </label>
          ))}

          {/* Pagination */}
          <div className="flex justify-between mt-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              ← Trước
            </button>

            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
