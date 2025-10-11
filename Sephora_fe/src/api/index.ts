import axios from "axios"
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

export async function getChosenForYou(filters?: {
  brands?: number[]
  minPrice?: number | null
  maxPrice?: number | null
  rating?: number | null
  sortBy?: string
  categoryId?: number | null
}) {
  const params = new URLSearchParams()
  if (filters?.categoryId) params.append("category", String(filters.categoryId))
  if (filters?.brands?.length)
    filters.brands.forEach((b) => params.append("brand", String(b)))
  if (filters?.minPrice) params.append("min_price", String(filters.minPrice))
  if (filters?.maxPrice) params.append("max_price", String(filters.maxPrice))
  if (filters?.rating) params.append("rating", String(filters.rating))
  if (filters?.sortBy) params.append("sort_by", filters.sortBy)

  const res = await fetch(
    `${API_BASE_URL}/products/chosen-for-you/?${params.toString()}`
  )

  if (!res.ok)
    throw new Error(`Failed to fetch /products/chosen-for-you (${res.status})`)

  return res.json()
}

export async function getProductsByCategory(params: {
  category_ids?: number[]
  page?: number
  size?: number
}) {
  const query = new URLSearchParams()

  if (params.category_ids && params.category_ids.length > 0) {
    params.category_ids.forEach((id) => query.append("category_ids", id.toString()))
  }

  if (params.page) query.append("page", params.page.toString())
  if (params.size) query.append("size", params.size.toString())

  const res = await axios.get(`${API_BASE_URL}/products/products-by-categories/?${query.toString()}`)
  return res.data
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
