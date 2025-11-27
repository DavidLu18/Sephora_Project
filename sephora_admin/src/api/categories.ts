import { fetchJSON } from "./index";
import { Category } from "@/types/category";

export const getCategories = async (): Promise<Category[]> => {
  return await fetchJSON("/api/categories/");
};

export const createCategory = async (
  data: { category_name: string; parent?: number | null }
): Promise<Category> => {
  return await fetchJSON("/api/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateCategory = async (
  id: number,
  data: { category_name: string; parent?: number | null }
): Promise<Category> => {
  return await fetchJSON(`/api/categories/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteCategory = async (id: number): Promise<void> => {
  return await fetchJSON(`/api/categories/${id}/`, { method: "DELETE" });
};