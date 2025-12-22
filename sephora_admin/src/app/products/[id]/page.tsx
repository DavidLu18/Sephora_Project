"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProductById,
  updateProduct,
  uploadProductImage,
} from "@/api/products";
import ProductForm from "@/components/ProductForm";
import { Product, ProductFormData } from "@/types/product";

export default function EditProductPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);

  const router = useRouter();

  // PRODUCT là loại dữ liệu trả về từ API
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<File[]>([]);

  /** FETCH PRODUCT */
  useEffect(() => {
    if (!id || isNaN(id)) return;

    getProductById(id).then((data: Product) => {
      setProduct(data);
    });
  }, [id]);

  /** SUBMIT FORM */
  const handleSubmit = async (formValues: ProductFormData) => {
    await updateProduct(id, formValues);

    if (images.length > 0) {
      for (const img of images) {
        await uploadProductImage(id, img);
      }
    }

    alert("Cập nhật sản phẩm thành công!");
    router.push("/products");
  };

  if (!product) return <p className="text-gray-400">Đang tải...</p>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">Chỉnh sửa sản phẩm</h1>

      <ProductForm
        initialData={product}   
        onSubmit={handleSubmit}
        setImages={setImages}
      />
    </div>
  );
}
