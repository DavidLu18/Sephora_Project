export interface ProductAnswer {
  id: number;
  content: string;
  answered_by: string;
  created_at: string;
}

export interface ProductQuestion {
  id: number;
  product: number;
  content: string;
  asked_by: string;
  helpful_count: number;
  created_at: string;
  answers: ProductAnswer[];
}
