export interface VoucherCreateInput {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  user_limit: number;
  start_time: string | null;
  end_time: string | null;
}

export interface Voucher extends VoucherCreateInput {
  voucher_id: number;
  used_count: number;
  is_active: boolean;
}

export interface Campaign {
  campaign_id: number;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed" | "free_ship";
  discount_value: number | null;
  min_order: number | null;
  max_discount: number | null;
  start_time: string;
  end_time: string;
  is_flash_sale: boolean;
}

// Payload gửi thông báo khuyến mãi
export interface PromoNotificationPayload {
  title: string;
  message: string;
}