import { fetchJSON } from "./index";

export interface ReviewItem {
  reviewid: number;
  product_name: string;

  product_id: number;
  product_sku: string;
  rating: number;
  review_text: string;
  review_images: string[];
  review_videos: string[];
  user_name: string;
  user_email: string | null;
  created_at: string;
}

export interface ReviewPaginated {
  results: ReviewItem[];
  total: number;
  page: number;
  page_size: number;
}

export const reviewsApi = {
  getAll(query: string): Promise<ReviewPaginated> {
    return fetchJSON(`/admin/reviews/${query}`);
  },

  delete(id: number): Promise<{ message: string }> {
    return fetchJSON(`/admin/reviews/${id}/delete/`, {
      method: "DELETE",
    });
  },
};
