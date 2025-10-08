import { Product } from "@/types/product"

export const API_BASE_URL = "http://127.0.0.1:8000/api"

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint} — ${res.statusText}`)
  }

  return res.json()
}

// --- API CALLS ---
export async function getAllProducts(): Promise<Product[]> {
  return fetchAPI("/products/")
}

export async function getChosenForYou(limit = 50): Promise<Product[]> {
  return fetchAPI(`/products/chosen-for-you/?limit=${limit}`)
}

export async function getNewArrivals(limit = 50): Promise<Product[]> {
  return fetchAPI(`/products/new-arrivals/?limit=${limit}`)
}

export async function getProductById(id: number): Promise<Product> {
  return fetchAPI(`/products/${id}/`)
}

// Lấy danh sách thương hiệu
export async function getBrands() {
  return fetchAPI("/brands/");
}

// Lấy cây danh mục
export async function getCategories() {
  return fetchAPI("/categories/");
}

export default fetchAPI
