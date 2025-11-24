export interface FilterState {
  categoryId?: number | null
  minPrice?: number | null
  maxPrice?: number | null
  sortBy?: string
  brands?: number[]
  rating?: number | null
}
