// Danh sách khách hàng
export interface Customer {
  userid: number;
  full_name: string;
  email: string;
  phone: string | null;
  isactive: boolean;
  total_orders: number;
  total_spent: number;
  createdat: string;
}

// Lịch sử đơn hàng
export interface OrderHistory {
  order_id: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

// Chi tiết khách hàng (FULL theo BE)
export interface CustomerDetail extends Customer {
  firstname: string;
  lastname: string;
  gender: string | null;
  dateofbirth: string | null;

  skintype: string | null;
  skinconcerns: string | null;
  agerange: string | null;
  skin_tone: string | null;
  hair_color: string | null;
  eye_color: string | null;

  fragrance_pref: string | null;
  allergy_info: string | null;

  order_history: OrderHistory[];
}

// Dữ liệu sử dụng trong form chỉnh sửa (khớp BE update fields)
export interface CustomerFormData {
  firstname: string;
  lastname: string;
  phone: string | null;
  gender: string | null;
  dateofbirth: string | null;

  skintype: string | null;
  skinconcerns: string | null;
  agerange: string | null;
  skin_tone: string | null;
  hair_color: string | null;
  eye_color: string | null;

  fragrance_pref: string | null;
  allergy_info: string | null;
}
