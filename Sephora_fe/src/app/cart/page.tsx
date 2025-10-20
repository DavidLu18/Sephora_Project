"use client";

import { useEffect, useState } from "react";
import { getCart, removeFromCart, checkoutCart } from "@/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Cart, CartItem} from "@/types/cart"
export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);

  // 🧩 Đợi Firebase xác thực xong
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Firebase user state:", user);
      if (user) {
        setUserReady(true);
        try {
          const res = await getCart();
          setCart(res);
        } catch (err) {
          console.error("Lỗi khi tải giỏ hàng:", err);
        }
      } else {
        setUserReady(false);
        setCart(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRemove = async (itemId: number) => {
    await removeFromCart(itemId);
    const updated = await getCart();
    setCart(updated);
  };

  const handleCheckout = async () => {
    const res = await checkoutCart("COD");
    alert(res.message || "Thanh toán thành công!");
    const updated = await getCart();
    setCart(updated);
  };

  if (loading) return <div className="p-10">Đang tải giỏ hàng...</div>;

  if (!userReady) return <div className="p-10">Vui lòng đăng nhập để xem giỏ hàng.</div>;

  if (!cart || !cart.items || cart.items.length === 0)
    return <div className="p-10">Giỏ hàng trống.</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Giỏ hàng của bạn</h1>

      {cart.items.map((item: CartItem) => (
        <div key={item.cartitemid} className="flex justify-between items-center border-b py-3">
          <div>
            <p className="font-medium">{item.product.product_name}</p>
            <p className="text-gray-500">{item.product.price}₫</p>
          </div>
          <div className="flex gap-3 items-center">
            <span>Số lượng: {item.quantity}</span>
            <button
              onClick={() => handleRemove(item.cartitemid)}
              className="text-red-500 hover:underline"
            >
              Xóa
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={handleCheckout}
        className="mt-6 bg-black text-white px-6 py-2 rounded"
      >
        Thanh toán
      </button>
    </div>
  );
}
