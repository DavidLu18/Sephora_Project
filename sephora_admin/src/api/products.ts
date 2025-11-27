import { fetchJSON, fetchFormData } from "./index";
import { Product, ProductFormData } from "@/types/product";
// Get list products
export async function getProducts(
  page: number,
  size: number,
  filters: {
    search?: string;
    brand?: number | string;
    category?: number | string;
    status?: string[]; // multiple
  } = {}
) {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("size", size.toString());

  if (filters.search) params.append("search", filters.search);
  if (filters.brand) params.append("brand", String(filters.brand));
  if (filters.category) params.append("category", String(filters.category));

  if (filters.status && filters.status.length > 0) {
    filters.status.forEach((s) => params.append("status", s));
  }

  return fetchJSON(`/api/products/?${params.toString()}`);
}


// Get product by ID
export const getProductById = async (id: number): Promise<Product> => {
  return await fetchJSON(`/api/products/${id}/`);
};

// CREATE product (multipart/form-data)
export const createProduct = async (data: FormData): Promise<Product> => {
  return await fetchFormData(`/api/admin/products/`, {
    method: "POST",
    body: data,
  });
};

// UPDATE product (multipart/form-data)
export const updateProduct = async (id: number, data: ProductFormData) => {
  return await fetchJSON(`/api/admin/products/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// DELETE product
export const deleteProduct = async (id: number): Promise<Product> => {
  return await fetchJSON(`/api/admin/products/${id}/`, {
    method: "DELETE",
  });
};

// UPLOAD product image (required)
export async function uploadProductImage(
  productId: number,
  file: File
): Promise<{ image_url: string }> {
  const fd = new FormData();
  fd.append("product_id", String(productId));
  fd.append("file", file);

  return fetchFormData(`/api/admin/products/upload-image/`, {
    method: "POST",
    body: fd,
  });
}
