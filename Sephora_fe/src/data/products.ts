// data/products.ts
// Dữ liệu mẫu (Sửa lại khi có dữ liệu đúng)

import { Product } from "@/types/product"



export const products: Product[] = [
  {
    id: 1,
    name: "Moroccanoil Hydrating Shampoo",
    subtitle: "For all hair types",
    price: 47.6,
    originalPrice: 56.0,
    image: "/products/product1.jpg",
    gallery: [
      "/products/product1.jpg",
      "/products/product2.jpg",
      "/products/product1.jpg",
      "/products/product2.jpg",
    ],
    reviews: 2400,
    sizes: [
      { label: "8.5 oz / 250 mL" },
      { label: "16.9 oz / 500 mL", selected: true },
      { label: "2.4 oz / 70 mL" },
    ],
    description:
    "A hydrating daily care shampoo infused with antioxidant-rich argan oil and replenishing nutrients to quench and nurture dry hair.",
    hairType: "Fine, Medium, and Thick",
    hairTexture: "Coily, Curly, Straight, and Wavy",
    ingredients:
      "Water, Sodium Lauroyl Sarcosinate, Argan Oil, Keratin, Glycerin, Fragrance.",
    howToUse:
      "Massage throughout wet hair and scalp. Rinse well. Follow with conditioner.",
  },
  {
    id: 2,
    name: "Jo Malone London Cologne",
    subtitle: "English Pear & Freesia",
    price: 35,
    originalPrice: 45,
    image: "/products/product1.jpg",
    gallery: [
      "/products/product1.jpg",
      "/products/product1.jpg",
      "/products/product1.jpg",
    ],
    reviews: 878,
    sizes: [
      { label: "1 oz / 30 mL", selected: true },
      { label: "3.4 oz / 100 mL" },
    ],
    description:
      "A fresh and fruity fragrance combining pear and freesia, balanced with amber and patchouli for an elegant scent experience.",
  },
  {
    id: 3,
    name: "Caudalie Vinoperfect Serum",
    subtitle: "Radiance & Dark Spot Correction",
    price: 82,
    image: "/products/product1.jpg",
    gallery: [
      "/products/product1.jpg",
      "/products/product1.jpg",
      "/products/product1.jpg",
    ],
    reviews: 3800,
    sizes: [
      { label: "1 oz / 30 mL", selected: true },
    ],
    description:
      "A lightweight serum that visibly evens skin tone and enhances radiance, powered by Caudalie’s patented Viniferine complex.",
  },
  {
    id: 4,
    name: "Tarte Maracuja Oil",
    subtitle: "Multi-purpose Hydrating Oil",
    price: 49,
    image: "/products/product1.jpg",
    gallery: [
      "/products/product1.jpg",
      "/products/product1.jpg",
    ],
    reviews: 2400,
    sizes: [
      { label: "1.7 oz / 50 mL", selected: true },
    ],
    description:
      "A nourishing oil rich in essential fatty acids and vitamin C, delivering deep hydration and a healthy glow.",
  },
  {
    id: 5,
    name: "Charlotte Tilbury Magic Cream",
    subtitle: "Instant Turnaround Moisturizer",
    price: 30,
    image: "/products/product1.jpg",
    gallery: [
      "/products/product1.jpg",
      "/products/product1.jpg",
      "/products/product1.jpg",
    ],
    reviews: 4900,
    sizes: [
      { label: "0.5 oz / 15 mL" },
      { label: "1 oz / 30 mL", selected: true },
      { label: "1.7 oz / 50 mL" },
    ],
    description:
      "An award-winning moisturizer that plumps, hydrates, and transforms tired skin into a glowing, dewy canvas.",
  },
]
