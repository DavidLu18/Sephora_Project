import { API_URL } from "./index";
import { AdminOrder } from "@/types/orders";

// ================================
// Lấy danh sách đơn hàng admin
// ================================
export const getAdminOrders = async (): Promise<AdminOrder[]> => {
  const res = await fetch(`${API_URL}/admin/orders/`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch admin orders");
  return res.json();
};

// ================================
// Lấy chi tiết đơn hàng
// ================================
export const getAdminOrderDetail = async (
  id: number
): Promise<AdminOrder> => {
  const res = await fetch(`${API_URL}/admin/orders/${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch admin order detail");
  return res.json();
};

// ================================
// Update trạng thái 1 đơn hàng
// ================================
export const updateAdminOrderStatus = async (
  id: number,
  status: string
): Promise<AdminOrder> => {
  const res = await fetch(`${API_URL}/admin/orders/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error("Failed to update order status");
  return res.json();
};

// ================================
// Update nhiều đơn hàng cùng lúc
// ================================
export const bulkUpdateAdminOrders = async (
  orderIds: number[],
  status: string
): Promise<{ updated: number }> => {
  const res = await fetch(`${API_URL}/admin/orders/bulk-update/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_ids: orderIds,
      status: status,
    }),
  });

  if (!res.ok) throw new Error("Failed to bulk update orders");
  return res.json();
};

// ================================
// Xóa nhiều đơn hàng
// ================================
export const bulkDeleteAdminOrders = async (
  orderIds: number[]
): Promise<{ deleted: number }> => {
  const res = await fetch(`${API_URL}/admin/orders/bulk-delete/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_ids: orderIds,
    }),
  });

  if (!res.ok) throw new Error("Failed to bulk delete orders");
  return res.json();
};

export const checkAdminOrders = async (orderIds: number[]) => {
  const res = await fetch(`${API_URL}/admin/orders/check/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_ids: orderIds }),
  });

  return res.json();
};

