import { fetchJSON } from "./index";

export interface QAItem {
  id: number;
  product_name: string;
  content: string;
  product_sku: string;  
  product_id: string;  
  asked_by: string;
  answer: string | null;
  created_at: string;
  status: "pending" | "answered";
}

export interface QAPaginated {
  results: QAItem[];
  total: number;
  page: number;
  page_size: number;
}

export const qnaApi = {
  getAll(query: string): Promise<QAPaginated> {
    return fetchJSON(`/admin/questions/${query}`);
  },

  answer(id: number, answer: string): Promise<{ message: string }> {
    return fetchJSON(`/admin/questions/${id}/answer/`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
  },

  delete(id: number): Promise<{ message: string }> {
    return fetchJSON(`/admin/questions/${id}/delete/`, {
      method: "DELETE",
    });
  },
};
