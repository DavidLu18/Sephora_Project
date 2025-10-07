import HeroBanner from "@/components/HeroBanner"
import ProductCarousel from "@/components/ProductCarousel"
import { products } from "@/data/products"

export default function Home() {
  return (
    <>
      <HeroBanner></HeroBanner>
      <ProductCarousel title="Chosen For You" products={products} />
      <ProductCarousel title="New Arrivals" products={products} />

    </>
  )
}
