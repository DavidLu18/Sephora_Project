'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getCart, removeFromCart, checkoutCart, updateCartQuantity, getAddresses,getUserProfile, applyVoucher, getAvailableVouchers  } from '@/api';
import { Cart, CartItem } from '@/types/cart';
import { Address } from "@/types/address";
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Voucher } from "@/types/voucher";

const formatVND = (value: number | string | null | undefined) => {
  if (value == null) return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return num.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);
  const [userProfile, setUserProfile] = useState<{ phone?: string } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<string>("COD");

  const [voucherCode, setVoucherCode] = useState<string>("");
  const [voucherInfo, setVoucherInfo] = useState<{
    code: string;
    discount_amount: number;
    final_total: number;
  } | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserReady(true);
        try {
          const token = await user.getIdToken(); 
          localStorage.setItem('token', token); 

          const res = await getCart(token); 
          setCart(res);

          const profile = await getUserProfile(token);
          setUserProfile(profile);
          
          try {
            const vouchers = await getAvailableVouchers(token);
            setVoucherList(vouchers);
          } catch (e) {
            console.error("Lỗi tải voucher:", e);
          }

          try {
            const addrList = await getAddresses();
            setAddresses(addrList);

            const def = addrList.find(a => a.isdefault);
            if (def) setSelectedAddress(def.addressid);
          } catch (e) {
            console.error("Lỗi khi tải địa chỉ:", e);
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


  useEffect(() => {
    setVoucherInfo(null);
    setVoucherMessage(null);
    setVoucherCode("");
  }, [cart]);

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
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      return;
    }

    if (!selectedAddress) {
      alert("Chưa thiết lập địa chỉ giao hàng!");
      window.location.href = "/account/info_account";
      return;
    }
    if (!userProfile?.phone) {
      alert("Bạn chưa thêm số điện thoại! Vui lòng cập nhật.");
      window.location.href = "/account/info_account";
      return;
    }


    try {
      const res = await checkoutCart(
        selectedPayment,
        selectedAddress,
        token,
        voucherInfo?.code || null
      );

      // Nếu backend trả lỗi
      if (res.error || res.success === false) {
        alert(res.error || res.message || "Thanh toán thất bại!");
        return;
      }

      // Nếu là VNPay redirect
      if (res.payment_url) {
        window.open(res.payment_url, "_blank", "noopener,noreferrer");
        return;
      }

      alert(res.message || "Thanh toán thành công!");

      window.dispatchEvent(new Event("cartUpdated"));
      const updated = await getCart(token);
      setCart(updated);

      if (selectedPayment === "COD") {
        window.location.href = "/account/orders";
      }

    } catch (err: unknown) {
      console.error("Checkout error:", err);

      if (err instanceof Error) {
        alert("Thanh toán thất bại: " + err.message);
      } else {
        alert("Thanh toán thất bại! Vui lòng thử lại.");
      }
    }
  };
  const handleApplyVoucher = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      return;
    }

    if (!voucherCode.trim()) {
      setVoucherMessage("Vui lòng nhập mã voucher.");
      return;
    }

    try {
      setVoucherLoading(true);
      setVoucherMessage(null);

      const response = await applyVoucher(voucherCode.trim(), total, token);

      if (!response.valid) {
        setVoucherInfo(null);
        setVoucherMessage(response.message || "Voucher không hợp lệ.");
        return;
      }

      setVoucherInfo({
        code: response.code || "",
        discount_amount: response.discount_amount || 0,
        final_total: response.final_total || total,
      });

      setVoucherMessage(response.message || "Áp dụng voucher thành công.");
    }catch (error) {
      let backendMessage = "";

      // Kiểm tra lỗi từ API trả về (HTTP 400/404/500)
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        backendMessage =
          (error as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }

      setVoucherInfo(null);
      setVoucherMessage(backendMessage || "Áp dụng voucher thất bại.");
    } finally {
      setVoucherLoading(false);
    }
  };

  

  if (loading) return <div className="p-10 text-center">Đang tải giỏ hàng...</div>;
  if (!userReady) return <div className="p-10 text-center">Vui lòng đăng nhập để xem giỏ hàng.</div>;
  if (!cart || !cart.items?.length) return <div className="p-10 text-center">Giỏ hàng trống.</div>;

  const total = cart.items.reduce((sum, i) => {
    const price =
      typeof i.product.price === "string"
        ? parseFloat(i.product.price)
        : i.product.price || 0;
    return sum + price * i.quantity;
  }, 0);
  
  const finalTotal = voucherInfo ? voucherInfo.final_total : total;
  const discountAmount = voucherInfo ? voucherInfo.discount_amount : 0;

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
                    <p className="font-semibold text-sm uppercase text-gray-600">
                      {item.product.brand_name || "Unknown Brand"}
                    </p>
                    <p className="font-medium text-lg mt-1">{item.product.product_name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      SIZE {item.product.size || "—"}
                    </p>
                    <p className="font-semibold text-base mt-2">
                      {formatVND(item.product.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartQuantity(item.cartitemid, Number(e.target.value)).then(() => {
                            const token = localStorage.getItem('token') || undefined;
                            getCart(token).then(setCart);
                          })
                        }
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
             {/* Tổng tạm tính */}
            <div className="flex justify-between text-sm mb-1">
              <span>Tạm tính</span>
              <span>{formatVND(total)}</span>
            </div>

            {/* Giảm giá voucher nếu có */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 mb-1">
                <span>Giảm giá (Voucher {voucherInfo?.code})</span>
                <span>- {formatVND(discountAmount)}</span>
              </div>
            )}

            <hr className="my-2" />

            {/* Tổng thanh toán */}
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Tổng thanh toán</span>
              <span className="text-xl font-bold">
                {formatVND(finalTotal)}
              </span>
            </div>

            {/* Ô nhập voucher */}
            <div className="mb-3">
              <label className="font-medium text-sm block mb-2">
                Mã voucher
              </label>
              <select
                className="border px-3 py-2 rounded w-full mb-3"
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  setVoucherCode(selectedCode);
                }}
              >
                <option value="">-- Chọn voucher --</option>

                {voucherList.map((v: Voucher) => (
                  <option key={v.voucher_id} value={v.code}>
                    {v.code} • 
                    {v.discount_type === "percent"
                      ? `${v.discount_value}%`
                      : `${formatVND(v.discount_value)}`
                    }
                    • HSD: {new Date(v.end_time).toLocaleDateString("vi-VN")}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 border px-3 py-2 rounded"
                  placeholder="Nhập mã giảm giá (nếu có)"
                />
                <button
                  onClick={handleApplyVoucher}
                  disabled={voucherLoading}
                  className="px-4 py-2 rounded bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-60"
                >
                  {voucherLoading ? "Đang áp dụng..." : "Áp dụng"}
                </button>
              </div>
              {voucherMessage && (
                <p className="text-xs mt-2 text-gray-600">
                  {voucherMessage}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="font-medium text-sm block mb-2">
                Phương thức thanh toán
              </label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="VNPAY">Thanh toán qua VNPay</option>
              </select>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition"
            >
              Đặt hàng
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-lg mb-3">Địa chỉ giao hàng</h3>

            {addresses.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Bạn chưa có địa chỉ. Vui lòng thêm trong tài khoản.
              </p>
            ) : (
              <select
                value={selectedAddress ?? ""}
                onChange={(e) => setSelectedAddress(Number(e.target.value))}
                className="border px-3 py-2 rounded w-full"
              >
                {addresses.map((addr) => (
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
