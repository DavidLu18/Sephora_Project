import { Product } from "./product"

export interface CartItem {
  cartitemid: number
  cartid: number
  product: Product
  quantity: number
  addedat: string
}

export interface Cart {
  cartid: number
  userid: number
  items: CartItem[]
  createdat: string
}
