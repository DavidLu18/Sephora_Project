import axios from "axios"
import { Product } from "@/types/product"
import { auth } from "@/lib/firebase"

export const API_BASE_URL = "http://127.0.0.1:8000/api"

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const currentUser = auth.currentUser
  const token = currentUser ? await currentUser.getIdToken(true) : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint} — ${res.statusText}`)
  }

  return res.json()
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


// Lấy giỏ hàng của người dùng
export async function getCart() {
  
  console.log("Current user:", auth.currentUser);
  return fetchAPI("/cart/");
}

// Thêm sản phẩm vào giỏ hàng
export async function addToCart(productId: number, quantity = 1) {
  return fetchAPI("/cart/add/", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

// Xóa sản phẩm khỏi giỏ hàng
export async function removeFromCart(itemId: number) {
  return fetchAPI("/cart/remove/", {
    method: "POST",
    body: JSON.stringify({ item_id: itemId }),
  });
}

// Thanh toán (checkout)
export async function checkoutCart(paymentMethod = "COD") {
  return fetchAPI("/cart/checkout/", {
    method: "POST",
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
}

// Lấy danh sách đơn hàng của user
export async function getOrders() {
  return fetchAPI("/orders/");
}

// Lấy chi tiết 1 đơn hàng
export async function getOrderDetail(orderId: number) {
  return fetchAPI(`/orders/${orderId}/`);
}


export default fetchAPI
