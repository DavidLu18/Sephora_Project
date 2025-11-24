"use client";

import { useEffect, useState, useCallback } from "react";
import { getProducts, deleteProduct } from "@/api/products";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { Brand } from "@/types/brand";
import { Category } from "@/types/category";
import { getBrands } from "@/api/brands";
import { getCategories } from "@/api/categories";
interface FlatCategory {
  id: number;
  name: string;
  level: number;
}
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const pageSize = 12;
  const fetchProducts = useCallback(
    async (p: number = 1, searchValue: string = search) => {
      try {
        setLoading(true);

        const data = await getProducts(p, pageSize, {
          search: searchValue,
          brand: brandFilter,
          category: categoryFilter,
          status: statusFilter,
        });

        setProducts(data.results);
        setTotal(data.count);
        setPage(p);

      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandFilter, categoryFilter, statusFilter]   
  );

  useEffect(() => {
    getBrands().then(setBrands);
    getCategories().then(setCategories);
  }, []);

  const flattenCategories = (nodes: Category[], level = 0): FlatCategory[] => {
    let result: FlatCategory[] = [];

    nodes.forEach((cat) => {
      result.push({
        id: cat.category_id,
        name: cat.category_name,
        level,
      });

      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });

    return result;
  };
  const categoryOptions = flattenCategories(categories).map((c) => ({
    id: c.id,
    label: `${"— ".repeat(c.level)}${c.name}`,
  }));
  
    const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm?")) return;

    try {
      await deleteProduct(id);
      fetchProducts(page);
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);
  
  const totalPages = Math.max(1, Math.ceil(total / pageSize));                  
  if (loading) {
    return (
      <div className="p-6 text-center text-lg font-semibold text-gray-200">
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111827] border border-gray-800 shadow-lg">
          <span className="h-3 w-3 rounded-full bg-pink-500 animate-pulse" />
          <span>Đang tải sản phẩm...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý sản phẩm
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Tổng cộng{" "}
            <span className="text-pink-400 font-medium">
              {total.toLocaleString()}
            </span>{" "}
            sản phẩm
          </p>
        </div>

        <Link href="/products/create">
          <button className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-sm font-medium text-white shadow-md shadow-pink-500/30 transition">
            + Thêm sản phẩm
          </button>
        </Link>
      </div>
      {/* FILTER BAR */}
      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 shadow flex flex-wrap gap-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm w-64"
        />

        {/* Brand Filter */}
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
        >
          <option value="">Tất cả thương hiệu</option>
          {brands.map((b) => (
            <option key={b.brand_id} value={b.brand_id}>
              {b.brand_name}
            </option>
          ))}
        </select>


        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>



        {/* STATUS FILTER (multi checkbox) */}
        <div className="flex items-center gap-3">
          {[
            { key: "exclusive", label: "Exclusive" },
            { key: "online", label: "Online Only" },
            { key: "outofstock", label: "Out of Stock" },
            { key: "limited", label: "Limited Edition" },
            { key: "new", label: "New" },
          ].map((st) => (
            <label key={st.key} className="text-xs text-gray-300 flex items-center gap-1">
              <input
                type="checkbox"
                checked={statusFilter.includes(st.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setStatusFilter([...statusFilter, st.key]);
                  } else {
                    setStatusFilter(statusFilter.filter((x) => x !== st.key));
                  }
                }}
              />
              {st.label}
            </label>
          ))}
        </div>

        {/* APPLY */}
        <button
          onClick={() => fetchProducts(1, search)}
          className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-sm font-medium text-white"
        >
          Lọc
        </button>

        {/* RESET */}
        <button
          onClick={() => {
            setSearch("");
            setBrandFilter("");
            setCategoryFilter("");
            setStatusFilter([]);
            fetchProducts(1);
          }}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-white"
        >
          Reset
        </button>
      </div>



      {/* Table wrapper */}
      <div className="bg-[#1a1a1a]  border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1a]  text-gray-300">
              <th className="p-3 border-b border-gray-800 font-medium text-left">
                Ảnh
              </th>
              <th className="p-3 border-b border-gray-800 font-medium text-left">
                Tên
              </th>
              <th className="p-3 border-b border-gray-800 font-medium text-left">
                Giá
              </th>
              <th className="p-3 border-b border-gray-800 font-medium text-left">
                Thương hiệu
              </th>
              <th className="p-3 border-b border-gray-800 font-medium text-left w-40">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-gray-500 text-sm"
                >
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr
                  key={item.productid}
                  className="border-b border-gray-800 hover:bg-gray-900/40 transition"
                >
                  <td className="p-3">
                    <div className="h-14 w-14 rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
                        {(() => {
                        const imageSrc =
                            item.thumbnail && item.thumbnail.trim() !== ""
                            ? item.thumbnail
                            : "/products/pro2.jpg"; // fallback an toàn
                        console.log("THUMBNAIL:", item.thumbnail);
                        return (
                            <Image
                            src={imageSrc}
                            alt={item.product_name}
                            width={56}
                            height={56}
                            className="object-cover"
                            />
                        );
                        })()}
                    </div>
                  </td>
                  <td className="p-3 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-100 line-clamp-1">
                        {item.product_name}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        SKU: {item.sku || "—"}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 align-middle">
                    {item.sale_price ? (
                      <div className="flex flex-col">
                        <span className="text-pink-400 font-semibold">
                          {Number(item.sale_price).toLocaleString()}₫
                        </span>
                        {item.price && (
                          <span className="text-xs text-gray-500 line-through">
                            {Number(item.price).toLocaleString()}₫
                          </span>
                        )}
                      </div>
                    ) : item.price ? (
                      <span className="text-gray-100 font-semibold">
                        {Number(item.price).toLocaleString()}₫
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  <td className="p-3 align-middle">
                    <span className="inline-flex items-center rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300 bg-gray-900/60">
                      {item.brand_name ?? "—"}
                    </span>
                  </td>

                  <td className="p-3 align-middle">
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${item.productid}`}
                        className="px-3 py-1.5 text-xs rounded-lg border border-pink-500 text-pink-300 hover:bg-pink-600/20 transition"
                      >
                        Sửa
                      </Link>

                      {/* <button
                        onClick={() => handleDelete(item.productid)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition"
                      >
                        Xóa
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
        <span>
          Đang xem{" "}
          <span className="text-pink-400">
            {products.length ? (page - 1) * pageSize + 1 : 0}–
            {(page - 1) * pageSize + products.length}
          </span>{" "}
          trên <span className="text-pink-400">{total}</span> sản phẩm
        </span>

        <div className="flex items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => fetchProducts(page - 1)}
            className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition"
          >
            ← Trước
          </button>

          <span className="font-medium text-gray-200">
            Trang{" "}
            <span className="text-pink-400">
              {page}/{totalPages}
            </span>
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => fetchProducts(page + 1)}
            className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
