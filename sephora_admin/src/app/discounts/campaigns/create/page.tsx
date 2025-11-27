"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/api";

import type { Brand, Category, Product } from "@/types";

import ProductDropdown from "@/components/ProductDropdown";
import CategoryDropdown from "@/components/CategoryDropdown";
import BrandDropdown from "@/components/BrandDropdown";

/* =======================================================
   TYPES
======================================================= */

type ApplyScope = "all" | "product" | "category" | "brand";

interface CampaignForm {
  title: string;
  description: string;
  discount_type: string;
  discount_value: string;
  min_order: string;
  max_discount: string;
  start_time: string;
  end_time: string;
  is_flash_sale: boolean;
  is_active: boolean;
  apply_scope: ApplyScope;
}

export interface CampaignCreateInput {
  title: string;
  description: string | null;
  apply_scope: ApplyScope;
  discount_type: "percent" | "fixed" | "free_ship";
  discount_value: number;
  min_order: number | null;
  max_discount: number | null;
  start_time: string;
  end_time: string;
  is_flash_sale: boolean;
  is_active: boolean;
  product_ids?: number[];
  category_ids?: number[];
  brand_ids?: number[];
}

/* =======================================================
   MAIN PAGE
======================================================= */
export default function CreateCampaignPage() {
  const router = useRouter();

  const [form, setForm] = useState<CampaignForm>({
    title: "",
    description: "",
    discount_type: "",
    discount_value: "",
    min_order: "",
    max_discount: "",
    start_time: "",
    end_time: "",
    is_flash_sale: false,
    is_active: true,
    apply_scope: "all",
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);

  /* =======================================================
     LOAD BRANDS
  ======================================================== */
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetchJSON("/api/brands/")
      .then((data: Brand[]) => setBrands(data))
      .catch((error) => {
        console.error("Failed to load brands", error);
        setBrands([]);
      });
  }, []);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================== */
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchJSON("/api/categories/")
      .then((data: Category[]) => setCategories(data))
      .catch((error) => {
        console.error("Failed to load categories", error);
        setCategories([]);
      });
  }, []);

  /* =======================================================
     HANDLE CHANGE
  ======================================================== */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const t = e.target;
    const value =
      t.type === "checkbox" ? (t as HTMLInputElement).checked : t.value;

    setForm((prev) => ({
      ...prev,
      [t.name]: value,
    }));
  };

  /* =======================================================
     SUBMIT
  ======================================================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body: CampaignCreateInput = {
      title: form.title,
      description: form.description || null,
      apply_scope: form.apply_scope,
      discount_type: form.discount_type as "percent" | "fixed" | "free_ship",
      discount_value: Number(form.discount_value),
      min_order: form.min_order ? Number(form.min_order) : null,
      max_discount:
        form.discount_type === "percent"
          ? form.max_discount
            ? Number(form.max_discount)
            : null
          : null,
      start_time: form.start_time,
      end_time: form.end_time,
      is_flash_sale: form.is_flash_sale,
      is_active: form.is_active,
    };

    if (form.apply_scope === "product") body.product_ids = selectedProducts;
    if (form.apply_scope === "category") body.category_ids = selectedCategories;
    if (form.apply_scope === "brand") body.brand_ids = selectedBrands;

    try {
      await fetchJSON("/api/promotions/admin/campaigns/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      alert("Tạo chương trình thành công!");
      router.push("/discounts");
    } catch (error) {
      console.error("Không thể tạo chương trình", error);
      alert("Không thể tạo chương trình khuyến mãi. Vui lòng thử lại.");
    }
  };

  /* =======================================================
     UI
  ======================================================== */
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold mb-6">Tạo chương trình khuyến mãi</h1>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-xl max-w-3xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* TITLE */}
          <div>
            <label className="block mb-1 text-gray-300">Tiêu đề</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            />
          </div>

          {/* APPLY SCOPE */}
          <div>
            <label className="block mb-1 text-gray-300">Phạm vi áp dụng</label>
            <select
              name="apply_scope"
              value={form.apply_scope}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            >
              <option value="all">Toàn cửa hàng</option>
              <option value="product">Theo sản phẩm</option>
              <option value="category">Theo danh mục</option>
              <option value="brand">Theo thương hiệu</option>
            </select>

            {form.apply_scope === "product" && (
              <ProductDropdown
                selected={selectedProducts}
                onChange={setSelectedProducts}
              />
            )}

            {form.apply_scope === "category" && (
              <CategoryDropdown
                categories={categories}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
            )}

            {form.apply_scope === "brand" && (
              <BrandDropdown
                brands={brands}
                selected={selectedBrands}
                onChange={setSelectedBrands}
              />
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block mb-1 text-gray-300">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded h-20"
            />
          </div>

          {/* DISCOUNT TYPE */}
          <div>
            <label className="block mb-1 text-gray-300">Loại giảm giá</label>
            <select
              name="discount_type"
              value={form.discount_type}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            >
              <option value="">-- Chọn loại giảm --</option>
              <option value="percent">Giảm phần trăm</option>
              <option value="fixed">Giảm cố định</option>
              <option value="free_ship">Miễn phí ship</option>
            </select>
          </div>

          {/* DISCOUNT VALUE */}
          <div>
            <label className="block mb-1 text-gray-300">Giá trị giảm</label>
            <input
              name="discount_value"
              type="number"
              value={form.discount_value}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            />
          </div>

          {/* MIN ORDER */}
          <div>
            <label className="block mb-1 text-gray-300">Đơn tối thiểu</label>
            <input
              name="min_order"
              type="number"
              value={form.min_order}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            />
          </div>

          {/* MAX DISCOUNT */}
          {form.discount_type === "percent" && (
            <div>
              <label className="block mb-1 text-gray-300">
                Giảm tối đa (khi giảm %)
              </label>
              <input
                name="max_discount"
                type="number"
                value={form.max_discount}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 p-2 rounded"
              />
            </div>
          )}

          {/* DATE FIELDS */}
          <div>
            <label className="block mb-1 text-gray-300">Ngày bắt đầu</label>
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-300">Ngày kết thúc</label>
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            />
          </div>

          {/* CHECKBOXES */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_flash_sale"
              checked={form.is_flash_sale}
              onChange={handleChange}
            />
            Flash Sale
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Kích hoạt
          </label>

          {/* SUBMIT */}
          <button
            type="submit"
            className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Tạo chương trình
          </button>
        </form>
      </div>
    </div>
  );
}
