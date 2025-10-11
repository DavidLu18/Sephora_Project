import { Category } from "./category"

export interface Product {
  productid: number
  sku?: string
  product_name: string
  price: number
  sale_price?: number
  currency?: string
  size?: string
  description?: string
  brand_name?: string
  category_name?: string
  avg_rating?: number
  reviews_count?: number
  highlight?: string[] 
  category?: Category
}
export interface ProductReview {
  reviewid: number
  productid: number
  userid: number
  rating: number
  review_title?: string
  review_text?: string
  helpfulness?: number
  total_feedback_count?: number
  submission_time: string
}