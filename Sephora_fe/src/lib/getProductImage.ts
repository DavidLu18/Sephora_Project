import { Product } from "@/types/product";

const API_DOMAIN = "http://127.0.0.1:8000"; // hoặc localhost

export function getProductImage(product: Product): string {
  const rawImage =
    (product.images && product.images[0]) ||
    product.thumbnail ||
    "/media/products/default.jpg";

  // Nếu backend trả "/media/products/xxx.jpg"
  if (rawImage.startsWith("/")) {
    return `${API_DOMAIN}${rawImage}`;
  }

  // Nếu backend trả URL hoàn chỉnh
  return rawImage;
}
