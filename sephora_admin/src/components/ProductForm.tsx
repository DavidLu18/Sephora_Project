"use client";

import { useState, useEffect  } from "react";
import { ProductFormData } from "@/types/product";
import { Brand } from "@/types/brand";
import { Category } from "@/types/category";
import { getBrands } from "@/api/brands";
import { getCategories } from "@/api/categories";
import DropdownSearch from "./DropdownSearch";
import Image from "next/image";

interface Props {
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData) => void;
  setImages?: (files: File[]) => void;
}

interface FlatCategory {
  id: number;
  name: string;
  level: number;
}

export default function ProductForm({ initialData, onSubmit, setImages }: Props) {
  //  Form khởi tạo giống bản cũ của bạn
  const [form, setForm] = useState<ProductFormData>(() => ({
    product_name: initialData?.product_name ?? "",
    sku: initialData?.sku ?? "",
    price: initialData?.price ?? null,
    sale_price: initialData?.sale_price ?? null,
    value_price: initialData?.value_price ?? null,
    stock: initialData?.stock ?? null,
    brand_id: initialData?.brand_id ?? null,
    category_id: initialData?.category_id ?? null,
    size: initialData?.size ?? "",
    highlight: initialData?.highlight ?? "",
    description: initialData?.description ?? "",
    ingredients: initialData?.ingredients ?? "",
    skin_types: initialData?.skin_types ?? "",
    is_exclusive: initialData?.is_exclusive ?? false,
    online_only: initialData?.online_only ?? false,
    out_of_stock: initialData?.out_of_stock ?? false,
    is_limited_edition: initialData?.is_limited_edition ?? false,
    is_new: initialData?.is_new ?? true,
    currency: initialData?.currency ?? "VND",
    images: initialData?.images ?? [],
  }));

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  //  Load Brands & Categories
  useEffect(() => {
    getBrands().then(setBrands);
    getCategories().then(setCategories);
  }, []);
  //  Thiết lập ảnh xem trước nếu có initialData
  useEffect(() => {
    if (!initialData) return;

    let imgs: string[] = [];

    // Nếu API có images array
    if (Array.isArray(initialData.images) && initialData.images.length > 0) {
      imgs = initialData.images.map((img: string) =>
        img.startsWith("http")
          ? img
          : `${process.env.NEXT_PUBLIC_BASE_URL}${img}`
      );
    }

    // Nếu không có images nhưng có thumbnail
    else if (initialData.thumbnail) {
      imgs = [
        initialData.thumbnail.startsWith("http")
          ? initialData.thumbnail
          : `${process.env.NEXT_PUBLIC_BASE_URL}${initialData.thumbnail}`
      ];
    }

    Promise.resolve().then(() => {
      setPreviewImages(imgs);
    });
  }, [initialData]);

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
    name: `${"— ".repeat(c.level)}${c.name}`,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? null : Number(value)) : value,
    }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    if (setImages) setImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  const cleanNumber = (
    value: string | number | null | undefined
  ): number | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return value;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };
  
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...form,
          price: cleanNumber(form.price),
          sale_price: cleanNumber(form.sale_price),
          value_price: cleanNumber(form.value_price),
          stock: cleanNumber(form.stock),
        });
      }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white"
    >
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">
        <Section title="Thông tin sản phẩm">
          <Input label="Tên sản phẩm" name="product_name" value={form.product_name} onChange={handleInputChange} />
          <Input label="SKU" name="sku" value={form.sku ?? ""} onChange={handleInputChange} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Giá" name="price" type="number" value={form.price} onChange={handleInputChange} />
            <Input label="Giá sale" name="sale_price" type="number" value={form.sale_price} onChange={handleInputChange} />
          </div>

          <DropdownSearch
            label="Brand"
            value={form.brand_id}
            options={brands.map((b) => ({ id: b.brand_id, name: b.brand_name }))}
            onChange={(id) => setForm((p) => ({ ...p, brand_id: id }))}
            placeholder="Tìm brand..."
          />

          <DropdownSearch
            label="Category"
            value={form.category_id}
            options={categoryOptions}
            onChange={(id) => setForm((p) => ({ ...p, category_id: id }))}
            placeholder="Tìm category..."
          />

          <Input label="Size" name="size" value={form.size ?? ""} onChange={handleInputChange} />
        </Section>

        <Section title="Mô tả chi tiết">
          <Textarea label="Highlights" name="highlight" value={form.highlight} onChange={handleTextareaChange} />
          <Textarea label="Mô tả" name="description" value={form.description} onChange={handleTextareaChange} />
          <Textarea label="Thành phần" name="ingredients" value={form.ingredients} onChange={handleTextareaChange} />
          <Textarea label="Loại da phù hợp" name="skin_types" value={form.skin_types} onChange={handleTextareaChange} />
        </Section>
      </div>

      {/* RIGHT */}
      <div className="space-y-6">
        <Section title="Cài đặt & Trạng thái">
          <Input label="Tồn kho" name="stock" type="number" value={form.stock} onChange={handleInputChange} />

          <label className="label-sephora">Currency</label>
          <select
            className="select-sephora"
            name="currency"
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <Checkbox label="Exclusive" name="is_exclusive" checked={form.is_exclusive} onChange={handleCheckboxChange} />
            <Checkbox label="Online Only" name="online_only" checked={form.online_only} onChange={handleCheckboxChange} />
            <Checkbox label="Out of Stock" name="out_of_stock" checked={form.out_of_stock} onChange={handleCheckboxChange} />
            <Checkbox label="Limited Edition" name="is_limited_edition" checked={form.is_limited_edition} onChange={handleCheckboxChange} />
            <Checkbox label="New" name="is_new" checked={form.is_new} onChange={handleCheckboxChange} />
          </div>
        </Section>

        <Section title="Hình ảnh">
          <p className="font-medium text-gray-200">Thêm hình</p>

          <div className="flex gap-4">
            {previewImages.length < 5 && (
              <label className="w-28 h-28 flex items-center justify-center bg-[#f5f5f5] hover:bg-gray-200 rounded-lg border border-gray-300 cursor-pointer text-black text-4xl font-light transition">
                +
                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
              </label>
            )}

            {previewImages.length > 0 &&
              previewImages.map((src, idx) => (
                <div key={idx} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-700">
                  <Image src={src} alt={`preview-${idx}`} fill className="object-cover" />
                  
                  <button
                    type="button"
                    onClick={() => setPreviewImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white px-2 py-1 text-xs rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </Section>

        <button className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium">
          Lưu sản phẩm
        </button>
      </div>
    </form>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-sephora">
      <h2 className="font-semibold text-gray-200">{title}</h2>
      {children}
    </div>
  );
}

interface InputProps {
  label: string;
  name: keyof ProductFormData;
  value: string | number | null;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Input({ label, name, value, type = "text", onChange }: InputProps) {
  return (
    <div>
      <label className="label-sephora">{label}</label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange} className="input-sephora" />
    </div>
  );
}

interface TextareaProps {
  label: string;
  name: keyof ProductFormData;
  value: string | null;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function Textarea({ label, name, value, onChange }: TextareaProps) {
  return (
    <div>
      <label className="label-sephora">{label}</label>
      <textarea name={name} rows={3} value={value ?? ""} onChange={onChange} className="textarea-sephora" />
    </div>
  );
}

interface CheckboxProps {
  label: string;
  name: keyof ProductFormData;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Checkbox({ label, name, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
