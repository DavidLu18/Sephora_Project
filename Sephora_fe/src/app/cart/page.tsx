'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getCart, removeFromCart, checkoutCart, updateCartQuantity, getAddresses, getPaymentMethods } from '@/api';
import { Cart, CartItem } from '@/types/cart';
import { Address } from "@/types/address";
import { PaymentMethod } from "@/types/payment";
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { convertToVND } from "@/lib/utils";
export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("COD");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserReady(true);
        try {
          const token = await user.getIdToken(); 
          localStorage.setItem('token', token); 

          const res = await getCart(token); 
          setCart(res);
          try {
            const addrList = await getAddresses();
            setAddresses(addrList);

            const def = addrList.find(a => a.isdefault);
            if (def) setSelectedAddress(def.addressid);
          } catch (e) {
            console.error("Lỗi khi tải địa chỉ:", e);
          }

          // NEW: Load phương thức thanh toán
          try {
            const methodList = await getPaymentMethods();
            setPaymentMethods(methodList);

            const defPay = methodList.find(m => m.is_default);
            if (defPay) setSelectedPayment(defPay.method_type);
          } catch (e) {
            console.error("Lỗi khi tải payment:", e);
          }
        } catch (err) {
          console.error('Lỗi khi tải giỏ hàng:', err);
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
    const token = localStorage.getItem('token');
    if (token) {
      await removeFromCart(itemId, token); 
      window.dispatchEvent(new Event("cartUpdated"));
      const updated = await getCart(token); 
      setCart(updated);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await checkoutCart(selectedPayment, token);

    //  Nếu backend trả link VNPay -> redirect
    if (res.payment_url) {
      window.location.href = res.payment_url;
      return;
    }

    //  Nếu COD -> xử lý như cũ
    alert(res.message || "Thanh toán thành công!");

    window.dispatchEvent(new Event("cartUpdated"));
    const updated = await getCart(token);
    setCart(updated);

    // Nếu COD -> chuyển sang trang đơn hàng
    if (selectedPayment === "COD") {
      window.location.href = "/account/orders";
    }
  };


  if (loading) return <div className="p-10 text-center">Đang tải giỏ hàng...</div>;
  if (!userReady) return <div className="p-10 text-center">Vui lòng đăng nhập để xem giỏ hàng.</div>;
  if (!cart || !cart.items?.length) return <div className="p-10 text-center">Giỏ hàng trống.</div>;

  const total = cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Giỏ hàng của bạn ({cart.items.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b"> 
              <h2 className="font-semibold text-lg">Giao hàng tận nhà ({cart.items.length})</h2>
            </div>
            <div className="p-4 text-sm text-gray-600 border-b">
              Thành viên nhận <span className="text-red-500 font-medium">miễn phí giao hàng tiêu chuẩn</span> cho mọi đơn.
            </div>

            {cart.items.map((item: CartItem, index: number) => (
              <div
                key={item.cartitemid}
                className={`flex flex-col md:flex-row gap-6 px-4 py-6 ${index < cart.items.length - 1 ? "border-b border-gray-200" : ""}`}
              >
                <Link href={`/products/${item.product.productid}`} className="flex-shrink-0 hover:opacity-80 transition">
                  <Image
                    src={item.product.image_url || "/products/pro2.jpg"}
                    alt={item.product.product_name}
                    width={130}
                    height={130}
                    unoptimized
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-semibold text-sm uppercase text-gray-600">{item.product.brand_name || "Unknown Brand"}</p>
                    <p className="font-medium text-lg mt-1">{item.product.product_name}</p>
                    <p className="text-sm text-gray-500 mt-1">SIZE {item.product.size || "—"}</p>
                    <p className="font-semibold text-base mt-2">
                      {convertToVND(item.product.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <select
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.cartitemid, Number(e.target.value)).then(() => {
                          const token = localStorage.getItem('token') || undefined; // Chuyển null thành undefined
                          getCart(token).then(setCart);// Cập nhật giỏ hàng sau khi thay đổi số lượng
                        })}
                        className="border rounded-md px-3 py-1 text-sm focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemove(item.cartitemid)}
                        className="border rounded-md p-2 hover:bg-gray-100 text-gray-600 flex items-center justify-center"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Summary */}
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-lg mb-3">Tổng tiền</h3>
            <p className="text-xl font-bold mb-2"> {convertToVND(total)}</p>
            <p className="text-sm text-gray-500 mb-5">Phí vận chuyển & thuế tính ở bước thanh toán.</p>
            {/* NEW: Phương thức thanh toán */}
            <div className="mb-4">
              <label className="font-medium text-sm block mb-2">Phương thức thanh toán</label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="COD">COD (Thanh toán khi nhận hàng)</option>
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.method_type}>
                    {pm.display_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition"
            >
              Đặt hàng
            </button>


          </div>
          {/* NEW: Địa chỉ giao hàng */}
          <div className="border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-lg mb-3">Địa chỉ giao hàng</h3>

            {addresses.length === 0 ? (
              <p className="text-gray-500 text-sm">Bạn chưa có địa chỉ. Vui lòng thêm trong tài khoản.</p>
            ) : (
              <select
                value={selectedAddress ?? ""}
                onChange={(e) => setSelectedAddress(Number(e.target.value))}
                className="border px-3 py-2 rounded w-full"
              >
                {addresses.map(addr => (
                  <option key={addr.addressid} value={addr.addressid}>
                    {addr.street}, {addr.district}, {addr.city}
                  </option>
                ))}
              </select>
            )}
          </div>
          

        </div>
      </div>
    </div>
  );
}
