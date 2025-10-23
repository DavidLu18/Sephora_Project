// import axios from "axios"
import { Product } from "@/types/product"
import { Category } from "@/types/category"
// import { auth } from "@/lib/firebase"; // Import Firebase Authentication
import {  CartItem } from "@/types/cart";
import { Order } from "@/types/order";
import { Brand } from "@/types/brand";



export const API_BASE_URL = "http://127.0.0.1:8000/api";

// Hàm fetchAPI để gửi token vào header
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Nếu là API không yêu cầu xác thực, bỏ qua phần token
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Tiến hành gọi API
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Kiểm tra trạng thái trả về của API
  if (!response.ok) {
    throw new Error(`Lỗi khi gọi API: ${response.statusText}`);
  }

  return response.json();  // Trả về dữ liệu JSON
}


// Lấy danh sách sản phẩm mới
export async function getNewArrivals(limit = 50): Promise<Product[]> {
  return fetchAPI(`/products/new-arrivals/?limit=${limit}`);
}

export async function getChosenForYou(filters?: {
  brands?: number[];
  minPrice?: number | null;
  maxPrice?: number | null;
  rating?: number | null;
  sortBy?: string;
  categoryId?: number | null;
}): Promise<Product[]> {
  const params = new URLSearchParams();

  if (filters?.categoryId) params.append("category", String(filters.categoryId));
  if (filters?.brands?.length)
    filters.brands.forEach((b) => params.append("brand", String(b)));
  if (filters?.minPrice) params.append("min_price", String(filters.minPrice));
  if (filters?.maxPrice) params.append("max_price", String(filters.maxPrice));
  if (filters?.rating) params.append("rating", String(filters.rating));
  if (filters?.sortBy) params.append("sort_by", filters.sortBy);

  return fetchAPI(`/products/chosen-for-you/?${params.toString()}`);
}

// Lấy chi tiết sản phẩm bằng productId
export async function getProductById(id: number): Promise<Product> {
  return fetchAPI(`/products/${id}/`);
}

// Lấy danh sách thương hiệu
export async function getBrands(): Promise<Brand[]> {
  return fetchAPI("/brands/");
}


// Lấy sản phẩm theo danh mục và phân trang
export async function getProductsByCategory(params: {
  category_ids?: number[];
  page?: number;
  size?: number;
}): Promise<Product[]> {
  const query = new URLSearchParams();

  if (params.category_ids && params.category_ids.length > 0) {
    params.category_ids.forEach((id) => query.append("category_ids", id.toString()));
  }

  if (params.page) query.append("page", params.page.toString());
  if (params.size) query.append("size", params.size.toString());

  return fetchAPI(`/products/products-by-categories/?${query.toString()}`);
}




// Lấy danh mục sản phẩm
export async function getCategories(): Promise<Category[]> {
  return fetchAPI("/categories/");
}

// Lấy giỏ hàng của người dùng
export const getCart = async (token?: string) => {
  const response = await fetch('http://localhost:8000/api/cart/', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Không thể lấy giỏ hàng');
  }

  return response.json();
};

// Thêm sản phẩm vào giỏ hàng
// api/index.ts
// api/index.ts

export const addToCart = async (productId: number, quantity: number) => {
  const token = localStorage.getItem('token') || undefined;

  if (!token) {
    throw new Error('Không có token, vui lòng đăng nhập');
  }

  const response = await fetch('http://127.0.0.1:8000/api/cart/add/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,  
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId, 
      quantity: quantity,     
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi khi thêm vào giỏ hàng: ${errorText}`);
  }

  return response.json();
};



// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (itemId: number, token: string) => {
  const response = await fetch('http://127.0.0.1:8000/api/cart/remove/', {
    method: 'POST',  // Đảm bảo gửi POST request
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: itemId,  // Gửi item_id trong body request
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi khi xóa sản phẩm khỏi giỏ hàng: ${errorText}`);
  }

  return response.json();  // Trả về kết quả nếu thành công
};

// Thanh toán giỏ hàng
export const checkoutCart = async (paymentMethod: string, token?: string) => {
  const response = await fetch('http://localhost:8000/api/cart/checkout/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentMethod }),
  });

  if (!response.ok) {
    throw new Error('Không thể thanh toán giỏ hàng');
  }

  return response.json();
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export async function updateCartQuantity(itemId: number, quantity: number): Promise<CartItem> {
  return fetchAPI("/cart/update_quantity/", {
    method: "POST",
    body: JSON.stringify({ item_id: itemId, quantity }),
  });
}


export const cancelOrder = async (orderId: number, token: string) => {
  const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/cancel/`, {  // Gọi đúng URL
    method: 'PATCH',  // PATCH để hủy đơn hàng
    headers: {
      'Authorization': `Bearer ${token}`,  // Thêm token vào header
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi khi hủy đơn hàng: ${errorText}`);
  }

  return response.json();  // Trả về kết quả nếu thành công
};


// Lấy danh sách đơn hàng của người dùng
export async function getOrders(): Promise<Order[]> {
  return fetchAPI("/orders/");
}

// Lấy chi tiết 1 đơn hàng
export async function getOrderDetail(orderId: number): Promise<Order> {
  return fetchAPI(`/orders/${orderId}/`);
}
// Lấy đơn hàng của người dùng với token
export const fetchOrders = async (token: string) => {
  const res = await fetch('/api/orders/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// Cập nhật đơn hàng với token
export const updateOrderStatus = async (orderId: number, status: string, token: string) => {
  const res = await fetch(`/api/orders/${orderId}/`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  return res.ok;
};

export default fetchAPI;
