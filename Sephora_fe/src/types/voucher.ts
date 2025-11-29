export interface ApplyVoucherResponse {
  valid: boolean;
  code?: string;
  discount_amount?: number;
  final_total?: number;
  message?: string;
}

export interface VoucherInfo {
  code: string;
  discount_amount: number;
  final_total: number;
}

export interface Voucher {
  voucher_id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number | null;
  max_discount: number | null;
  start_time: string;
  end_time: string;
}