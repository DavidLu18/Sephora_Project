// import axios from "axios"
import { Product } from "@/types/product"
import { Category } from "@/types/category"
// import { auth } from "@/lib/firebase"; // Import Firebase Authentication
import {  CartItem } from "@/types/cart";
import { Order } from "@/types/order";
import { Brand } from "@/types/brand";
import { ProductQuestion, ProductAnswer } from "@/types/qa";
import { Address } from "@/types/address";
import { PaymentMethod } from "@/types/payment";  
import { ApplyVoucherResponse,Voucher  } from "@/types/voucher";
import { NotificationResponse } from "@/types/notification";
export const API_BASE_URL = "http://127.0.0.1:8000/api";


// Hàm fetchAPI để gửi token vào header
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw {
      status: response.status,
      response: { data },
    };
  }

  return data;
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


export interface PersonalizedSkinProfilePayload {
  skin_type?: string;
  skin_concerns?: string[];
  age_range?: string;
  skin_tone?: string;
  eye_color?: string;
  hair_color?: string;
  fragrance_pref?: string;
  allergy_info?: string;
  budget_level?: string;
  climate?: string;
  routine_focus?: string;
  save_profile?: boolean;
  legacy_author_id?: string;
}

export interface PersonalizedSearchPayload {
  search_query?: string;
  limit?: number;
  session_id?: string;
  user_email?: string;
  skin_profile: PersonalizedSkinProfilePayload;
}

export interface PersonalizedRecommendation {
  product: Product;
  match_percentage: number;
  reasons: string[];
  scores: {
    dnn: number;
    ncf: number | null;
    final: number;
  };
  ranking?: {
    bucket_label: string;
    z_score: number;
    diff_percent: number;
  };
}

export interface PersonalizedSearchResponse {
  session_id: string;
  personalized: boolean;
  results: PersonalizedRecommendation[];
  explanation: {
    summary: string;
    factors: {
      skin_type?: string;
      concerns?: string[];
      age_range?: string;
    };
  };
}

export interface PersonalizedFeedbackPayload {
  session_id: string;
  rating: number;
  helpful?: boolean;
  comment?: string;
  experience_tags?: string[];
}

export async function personalizedSearch(
  payload: PersonalizedSearchPayload
): Promise<PersonalizedSearchResponse> {
  const res = await fetch(`${API_BASE_URL}/recommendations/personalized-search/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Không thể tạo gợi ý cá nhân hóa");
  }

  return (await res.json()) as PersonalizedSearchResponse;
}

export async function submitPersonalizedFeedback(payload: PersonalizedFeedbackPayload) {
  const res = await fetch(`${API_BASE_URL}/recommendations/personalized-feedback/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Không thể gửi phản hồi");
  }

  return res.json();
}

export async function getUserProfile(token: string) {
  const res = await fetch("http://127.0.0.1:8000/api/users/profile/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Không tải được thông tin user");

  return res.json();
}


interface ProductResponse {
  count: number;
  results: Product[];
}

export async function getProductsByCategory(params: {
  category_ids?: number[];
  page?: number;
  size?: number;
  min_price?: number;
  max_price?: number;
  rating?: number;
  sort_by?: string;
  brand_ids?: number[];
}): Promise<ProductResponse> {
  const query = new URLSearchParams();

  if (params.category_ids && params.category_ids.length > 0) {
    params.category_ids.forEach((id) =>
      query.append("category_ids", id.toString())
    );
  }

  if (params.page) query.append("page", params.page.toString());
  if (params.size) query.append("size", params.size.toString());
  if (params.min_price) query.append("min_price", params.min_price.toString());
  if (params.max_price) query.append("max_price", params.max_price.toString());
  if (params.rating) query.append("rating", params.rating.toString());
  if (params.sort_by) query.append("sort_by", params.sort_by);
  if (params.brand_ids && params.brand_ids.length > 0) {
    params.brand_ids.forEach((id) =>
      query.append("brand_ids", id.toString())
    );
  }

  //  Gọi API và ép kiểu dữ liệu trả về
  const data = await fetchAPI(
    `/products/products-by-categories/?${query.toString()}`
  );

  return data as ProductResponse;
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
export const checkoutCart = async (
  paymentMethod: string,
  addressId: number | null,
  token?: string,
  voucherCode?: string | null
) => {
  const response = await fetch('http://localhost:8000/api/cart/checkout/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_method: paymentMethod,
      address_id: addressId,  
      voucher_code: voucherCode || null,
    }),
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
// ==============================
//  PRODUCT Q&A (Questions & Answers)
// ==============================

//  Lấy danh sách câu hỏi theo sản phẩm
export async function getQuestionsByProduct(productId: number): Promise<ProductQuestion[]> {
  return fetchAPI(`/products/${productId}/questions/`);
}

//  Tạo câu hỏi mới
export async function createQuestion(
  productId: number,
  content: string
): Promise<ProductQuestion> {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/questions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi khi gửi câu hỏi: ${err}`);
  }

  return res.json();
}

// Gửi trả lời cho câu hỏi (chỉ dành cho nhân viên)
export async function createAnswer(questionId: number, content: string, token?: string): Promise<ProductAnswer> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/questions/${questionId}/answers/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi khi gửi câu trả lời: ${err}`);
  }

  return res.json();
}

//  Đánh dấu "Hữu ích"
export async function markQuestionHelpful(questionId: number, token?: string): Promise<{ helpful_count: number }> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/questions/${questionId}/helpful/`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi khi đánh dấu hữu ích: ${err}`);
  }

  return res.json();
}

// Lấy danh sách địa chỉ của user
export async function getAddresses(): Promise<Address[]> {
  return fetchAPI("/address/", {
    method: "GET",
    credentials: "include",
  });
}

// Tạo địa chỉ mới
export async function createAddress(data: {
  country: string;
  city: string;
  district?: string;
  street?: string;
  zipcode?: string;
  isdefault?: boolean;
}): Promise<Address> {
  return fetchAPI("/address/", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
  });
}

// Xóa địa chỉ
export async function deleteAddress(addressId: number): Promise<void> {
  await fetchAPI(`/address/${addressId}/`, {
    method: "DELETE",
    credentials: "include",
  });
}

// Đặt địa chỉ mặc định
export async function setDefaultAddress(addressId: number): Promise<void> {
  await fetchAPI(`/address/${addressId}/set-default/`, {
    method: "PATCH",
    credentials: "include",
  });
}

export const getCities = async () => {
  const res = await fetch(`${API_BASE_URL}/locations/cities/`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Không thể lấy danh sách thành phố");
  }

  return res.json();
};


export const getWards = async (cityCode: string) => {
  const res = await fetch(`${API_BASE_URL}/locations/wards/${cityCode}/`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Không thể lấy danh sách phường/xã");
  }

  return res.json();
};


export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return fetchAPI("/payment/methods/", {
    method: "GET",
    credentials: "include",
  });
}

// Thêm phương thức thanh toán mới
export async function addPaymentMethod(data: {
  method_type: "credit_card" | "vnpay_wallet";
  card_brand?: string;
  card_last4?: string;
}): Promise<PaymentMethod> {
  return fetchAPI("/payment/methods/add/", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
  });
}

// Xóa phương thức thanh toán
export async function deletePaymentMethod(methodId: number): Promise<void> {
  await fetchAPI(`/payment/methods/${methodId}/delete/`, {
    method: "DELETE",
    credentials: "include",
  });
}

// Đặt phương thức thanh toán mặc định
export async function setDefaultPaymentMethod(methodId: number): Promise<void> {
  await fetchAPI(`/payment/methods/${methodId}/set-default/`, {
    method: "PUT",
    credentials: "include",
  });
}


export async function applyVoucher(
  code: string,
  orderTotal: number,
  token: string
): Promise<ApplyVoucherResponse> {
    const data = await fetchAPI(`/promotions/apply-voucher/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, order_total: orderTotal }),
    });

    return data;
}


export async function getAvailableVouchers(token: string): Promise<Voucher[]> {
  return fetchAPI(
    `/promotions/available-vouchers/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getWishlists(token: string) {
  return fetchAPI(`/wishlists/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function toggleHeart(productId: number, token: string) {
  return fetchAPI(`/wishlists/toggle-heart/`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addToWishlist(wishlistId: number, productId: number, token: string) {
  return fetchAPI(`/wishlists/${wishlistId}/add-item/`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeFromWishlist(wishlistId: number, productId: number, token: string) {
  return fetchAPI(`/wishlists/${wishlistId}/remove-item/`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createWishlist(name: string, token: string) {
  return fetchAPI(`/wishlists/`, {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: { Authorization: `Bearer ${token}` },
  });
}
export async function renameWishlist(wishlistId: number, name: string, token: string) {
  return fetchAPI(`/wishlists/${wishlistId}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
}

// Xóa wishlist
export async function deleteWishlist(wishlistId: number, token: string) {
  return fetchAPI(`/wishlists/${wishlistId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getNotifications(token: string): Promise<NotificationResponse> {
  return await fetchAPI(`/notifications/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markNotificationRead(id: number, token: string): Promise<void> {
  await fetchAPI(`/notifications/read/${id}/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
export default fetchAPI;
