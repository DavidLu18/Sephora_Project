import Image from "next/image"
import Link from "next/link"
import { Product } from "@/types/product"

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="border rounded-lg shadow-sm p-3 hover:shadow-md transition w-full">
          <Image src={product.image} alt={product.name} width={192} height={192} className="rounded"/>
          <h3 className="mt-2 text-sm font-semibold truncate">{product.name}</h3>
          <p className="text-gray-700">${product.price}</p>
          <p className="text-xs text-gray-500">{product.reviews} reviews</p>
        </div>
      </Link>
  )
}
