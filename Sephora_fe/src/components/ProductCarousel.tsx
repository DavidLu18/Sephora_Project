import Link from "next/link"
import ProductCard from "./ProductCard"
import { Product } from "@/types/product"

interface Props {
  title: string
  products: Product[]
}

export default function ProductCarousel({ title, products }: Props) {
  return (
    <section className="px-24 py-6"> 
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link
          href="/shop"//Sửa lại khi có data
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Show more
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {products.slice(0, 6).map((p: Product) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
