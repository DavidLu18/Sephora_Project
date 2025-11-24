import { Category } from "./category";

export interface Product {
  productid: number;
  sku: string | null;
  product_name: string;

  brand_name: string | null;
  brand_id: number | null;

  price: number | null;
  sale_price: number | null;
  value_price: number | null;

  currency: string | null;
  size: string | null;

  description: string | null;
  highlight: string[];      // luôn là array
  ingredients: string | null;
  skin_types: string | null;

  is_exclusive: boolean | null;
  online_only: boolean | null;
  out_of_stock: boolean | null;
  is_limited_edition: boolean | null;
  is_new: boolean | null;

  avg_rating: number;
  review_count: number;     // CHÍNH XÁC THEO API DJANGO

  stock: number | null;

  category: Category | null;

  images: string[];         // list ảnh
  thumbnail: string;        // URL ảnh đại diện
}


export interface ProductFormData {
  product_name: string;

  sku: string | null;

  price: number | null;
  sale_price: number | null;
  value_price: number | null;

  stock: number | null;

  brand_id: number | null;
  category_id: number | null;

  size: string | null;

  highlight: string | null;
  description: string | null;
  ingredients: string | null;
  skin_types: string | null;

  is_exclusive: boolean;
  online_only: boolean;
  out_of_stock: boolean;
  is_limited_edition: boolean;
  is_new: boolean;

  currency: string;
  images?: string[];
  thumbnail?: string;
}
export interface ProductFilter {
  search?: string;
  brand?: string;
  category?: string;
  stock?: "in" | "out";
  min_price?: number;
  max_price?: number;
}
export interface StatusFilter {
  is_exclusive?: boolean;
  online_only?: boolean;
  out_of_stock?: boolean;
  is_limited_edition?: boolean;
  is_new?: boolean;
}

export interface FlatCategory {
  id: number;
  name: string;
  level: number;
}


export interface ProductFilter {
  search?: string;
  brand_id?: number;
  category_id?: number;
  statuses?: StatusFilter;
}
