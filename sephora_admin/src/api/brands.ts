import { fetchJSON } from "./index";
import { Brand } from "@/types";

export const getBrands = async (): Promise<Brand[]> => {
  return await fetchJSON("/brands/");
};
export const createBrand = async (
  data: { brand_name: string }
): Promise<Brand> => {
  return await fetchJSON("/brands/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateBrand = async (
  id: number,
  data: { brand_name: string }
): Promise<Brand> => {
  return await fetchJSON(`/brands/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteBrand = async (id: number): Promise<void> => {
  return await fetchJSON(`/brands/${id}/`, { method: "DELETE" });
};