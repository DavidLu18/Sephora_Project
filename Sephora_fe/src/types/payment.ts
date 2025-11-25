export interface PaymentMethod {
  id: number;
  method_type: "credit_card" | "vnpay_wallet";
  display_name: string;
  card_last4?: string | null;
  card_brand?: string | null;
  fake_token: string;
  is_default: boolean;
  created_at: string;
}
