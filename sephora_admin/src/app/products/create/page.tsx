"use client";

import { useState } from "react";
import { ProductFormData } from "@/types/product";
import {  uploadProductImage } from "@/api/products";
import ProductForm from "@/components/ProductForm";
import { useRouter } from "next/navigation";
import { fetchFormData } from "@/api/index"; // THÊM IMPORT NÀY

export default function CreateProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
        alert("Bạn phải chọn ít nhất 1 hình ảnh!");
        return;
    }

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === "" || value === undefined) return;

      if (key === "brand_id") {
        formData.append("brand", String(value));
        return;
      }

      if (key === "category_id") {
        formData.append("category", String(value));
        return;
      }

      formData.append(key, String(value));
    });

    const product = await fetchFormData("/admin/products/", {
      method: "POST",
      body: formData,
    });

    if (!product?.productid) {
        alert("Không tạo được sản phẩm!");
        return;
    }

    const productId = product.productid;

    for (const img of images) {
        await uploadProductImage(productId, img);
    }
    alert("Thêm sản phẩm thành công!");
    router.push("/products");
  };



  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">Thêm sản phẩm mới</h1>

      {/* FORM NHẬP THÔNG TIN */}
      <ProductForm onSubmit={handleSubmit} setImages={setImages} />
    </div>
  );
}
