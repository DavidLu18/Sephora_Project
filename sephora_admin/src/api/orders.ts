import { fetchJSON } from "./index";
import { AdminOrder } from "@/types/orders";

// ================================
// Lấy danh sách đơn hàng admin
// ================================
export const getAdminOrders = async (): Promise<AdminOrder[]> => {
  return fetchJSON("/api/admin/orders/", { cache: "no-store" });
};

// ================================
// Lấy chi tiết đơn hàng
// ================================
export const getAdminOrderDetail = async (
  id: number
): Promise<AdminOrder> => {
  return fetchJSON(`/api/admin/orders/${id}/`, { cache: "no-store" });
};

// ================================
// Update trạng thái 1 đơn hàng
// ================================
export const updateAdminOrderStatus = async (
  id: number,
  status: string
): Promise<AdminOrder> => {
  return fetchJSON(`/api/admin/orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

// ================================
// Update nhiều đơn hàng cùng lúc
// ================================
export const bulkUpdateAdminOrders = async (
  orderIds: number[],
  status: string
): Promise<{ updated: number }> => {
  return fetchJSON(`/api/admin/orders/bulk-update/`, {
    method: "POST",
    body: JSON.stringify({
      order_ids: orderIds,
      status,
    }),
  });
};

// ================================
// Xóa nhiều đơn hàng
// ================================
export const bulkDeleteAdminOrders = async (
  orderIds: number[]
): Promise<{ deleted: number }> => {
  return fetchJSON(`/api/admin/orders/bulk-delete/`, {
    method: "POST",
    body: JSON.stringify({
      order_ids: orderIds,
    }),
  });
};

export const checkAdminOrders = async (orderIds: number[]) => {
  return fetchJSON(`/api/admin/orders/check/`, {
    method: "POST",
    body: JSON.stringify({ order_ids: orderIds }),
  });
};

