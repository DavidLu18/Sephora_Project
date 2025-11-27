import { fetchJSON } from ".";

export interface RecommendationSettings {
  dnn_weight: number;
  ncf_weight: number;
  max_results: number;
  updated_at?: string;
  updated_by?: string;
}

export const getRecommendationSettings = async (): Promise<RecommendationSettings> =>
  fetchJSON("/api/recommendations/config/");

export const updateRecommendationSettings = async (
  payload: RecommendationSettings
): Promise<RecommendationSettings> =>
  fetchJSON("/api/recommendations/config/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });


