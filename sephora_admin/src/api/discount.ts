import { Voucher, VoucherCreateInput, Campaign } from "@/types/discount";
import { fetchJSON } from "./index";

// ======================
// VOUCHERS
// ======================
export const getVouchers = (): Promise<Voucher[]> => {
  return fetchJSON("/promotions/admin/vouchers/");
};

export const createVoucher = (data: VoucherCreateInput): Promise<Voucher> => {
  return fetchJSON("/promotions/admin/vouchers/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const deleteVoucher = (id: number): Promise<void> => {
  return fetchJSON(`/promotions/admin/vouchers/${id}/`, {
    method: "DELETE",
  });
};

export const updateVoucher = (
  id: number,
  data: Partial<VoucherCreateInput>
): Promise<Voucher> => {
  return fetchJSON(`/promotions/admin/vouchers/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// ======================
// CAMPAIGNS
// ======================
export const getCampaigns = (): Promise<Campaign[]> => {
  return fetchJSON("/promotions/admin/campaigns/");
};

export const createCampaign = (data: Partial<Campaign>): Promise<Campaign> => {
  return fetchJSON("/promotions/admin/campaigns/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const deleteCampaign = (id: number): Promise<void> => {
  return fetchJSON(`/promotions/admin/campaigns/${id}/`, {
    method: "DELETE",
  });
};

// ======================
// GỬI THÔNG BÁO KHUYẾN MÃI
// ======================
export interface PromoNotificationPayload {
  title: string;
  message: string;
}

export const sendPromoNotification = (
  data: PromoNotificationPayload
): Promise<void> => {
  return fetchJSON("/notifications/admin/send-promo/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
