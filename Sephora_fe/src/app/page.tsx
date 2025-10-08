"use client"

import { useEffect, useState } from "react"
import HeroBanner from "@/components/HeroBanner"
import ProductCarousel from "@/components/ProductCarousel"
import { getChosenForYou, getNewArrivals } from "@/api"
import { Product } from "@/types/product"

export default function Home() {
  const [chosenProducts, setChosenProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chosenData, newData] = await Promise.all([
          getChosenForYou(),
          getNewArrivals(),
        ])
        setChosenProducts(chosenData)
        setNewArrivals(newData)
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <HeroBanner />
      <ProductCarousel title="Chosen For You" products={chosenProducts} />
      <ProductCarousel title="New Arrivals" products={newArrivals} />
    </>
  )
}
