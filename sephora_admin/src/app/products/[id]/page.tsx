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

  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [images, setImages] = useState<File[]>([]);

  /** MAP API → FORM DATA */
  function mapProductToForm(data: Product): ProductFormData {
    return {
      product_name: data.product_name,
      sku: data.sku,

      price: data.price ? Number(data.price) : null,
      sale_price: data.sale_price ? Number(data.sale_price) : null,
      value_price: data.value_price ? Number(data.value_price) : null,

      stock: data.stock ?? null,

      brand_id: data.brand_id ?? null,

      category_id: data.category?.category_id ?? null,

      size: data.size ?? "",

      highlight: Array.isArray(data.highlight)
        ? data.highlight.join(", ")
        : "",

      description: data.description ?? "",
      ingredients: data.ingredients ?? "",
      skin_types: data.skin_types ?? "",

      is_exclusive: data.is_exclusive ?? false,
      online_only: data.online_only ?? false,
      out_of_stock: data.out_of_stock ?? false,
      is_limited_edition: data.is_limited_edition ?? false,
      is_new: data.is_new ?? true,

      currency: data.currency ?? "VND",

      images: data.images ?? [],
      thumbnail: data.thumbnail ?? null,
    };
  }

  /** FETCH PRODUCT */
  useEffect(() => {
    if (!id || isNaN(id)) return;

    getProductById(id).then((data: Product) => {
      setProduct(mapProductToForm(data));
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
