export interface Product {
  id: number
  name: string
  subtitle?: string
  price: number
  originalPrice?: number
  image: string
  gallery?: string[]
  reviews: number
  likes?: number
  sizes?: {
    label: string
    selected?: boolean
  }[]
  description?: string
  hairType?: string
  hairTexture?: string
  ingredients?: string
  howToUse?: string
  averageRating?: number
  recommendedPercent?: number
  pros?: string[]
  cons?: string[]
  reviewImages?: string[]
  userReviews?: ProductReview[]
}
export interface ProductReview {
  id: number
  author: string
  rating: number
  date: string
  comment: string
  helpful?: number
  notHelpful?: number
  image?: string
}