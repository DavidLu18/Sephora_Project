  'use client';
  import Image from "next/image";
  import { useEffect, useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { Order } from '@/types/order';
  import { onAuthStateChanged } from 'firebase/auth';
  import { auth } from '@/lib/firebase';
  import { addToCart, cancelOrder } from '@/api'; // import addToCart và cancelOrder từ API
  import Link from "next/link";

  const TABS = [
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [userReady, setUserReady] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserReady(true);
          try {
            const token = await user.getIdToken();
            localStorage.setItem('token', token);

            const res = await fetch('http://localhost:8000/api/orders/', {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!res.ok) {
              console.error('Lỗi khi tải đơn hàng:', await res.json());
              return;
            }

            const data = await res.json();
            const safeData = data.map((order: Order) => ({
              ...order,
              items: order.items || [],
            }));
            setOrders(safeData);
          } catch (err) {
            console.error('Lỗi khi tải đơn hàng:', err);
          }
        } else {
          setUserReady(false);
          setOrders([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [router]);

    // Lọc đơn hàng theo trạng thái tab
    const filteredOrders = orders.filter((o) => o.status === activeTab);

    const handleReorderAll = async (order: Order) => {
      try {
        // Thêm tất cả sản phẩm trong đơn hàng vào giỏ
        for (const item of order.items) {
          await addToCart(item.productid, item.quantity);
          window.dispatchEvent(new Event("cartUpdated"));
        }
        alert("Đã thêm tất cả sản phẩm vào giỏ hàng!");
      } catch (error) {
        console.error("Lỗi khi mua lại toàn bộ:", error);
      }
    };

    const handleReorderProduct = async (productId: number, quantity: number) => {
      try {
        // Thêm một sản phẩm vào giỏ
        await addToCart(productId, quantity);
        window.dispatchEvent(new Event("cartUpdated"));
        alert("Đã thêm sản phẩm vào giỏ hàng!");
      } catch (error) {
        console.error("Lỗi khi mua lại sản phẩm:", error);
      }
    };

    const handleCancelOrder = async (orderId: number) => {
      try {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token') || undefined; // Nếu token là null thì sẽ chuyển thành undefined

        if (!token) {
          alert("Vui lòng đăng nhập để thực hiện hành động này.");
          return;  // Nếu không có token, dừng lại và không thực hiện hành động
        }

        // Gọi API hủy đơn hàng
        const response = await cancelOrder(orderId, token);

        if (response.message === "Đơn hàng đã được hủy.") {
          // Cập nhật danh sách đơn hàng sau khi hủy (xóa đơn hàng khỏi state)
          setOrders(prevOrders => prevOrders.map(order => 
            order.orderid === orderId ? { ...order, status: 'cancelled' } : order
          )); // Cập nhật trạng thái 'cancelled'
          alert("Đơn hàng đã được hủy!");
        } else {
          alert("Không thể hủy đơn hàng.");
        }
      } catch (error) {
        // Xử lý lỗi nếu có lỗi trong quá trình gọi API
        console.error("Lỗi khi hủy đơn hàng:", error);
        alert("Đã có lỗi xảy ra khi hủy đơn hàng.");
      }
    };
    const formatVND = (value: number | string | null) => {
      if (!value) return "N/A";
      return Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    };
    if (loading) return <div className="p-10 text-center">Đang tải lịch sử đơn hàng...</div>;
    if (!userReady) return <div className="p-10 text-center">Vui lòng đăng nhập để xem lịch sử đơn hàng.</div>;

    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-6">Lịch sử đơn hàng</h1>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.key
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách đơn hàng */}
        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Không có đơn hàng {TABS.find(t => t.key === activeTab)?.label.toLowerCase()}.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.orderid} className="border rounded-xl shadow-sm bg-white">
                {/* Header: Thông tin shop */}
                <div className="flex justify-between items-center border-b p-4">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span className="font-medium text-gray-800">Ngày mua:</span>{" "}
                    {new Date(order.createdat).toLocaleDateString("vi-VN")}
                  </div>
                  <span
                    className={`text-sm ${
                      order.status === "delivered"
                        ? "text-green-600"
                        : order.status === "pending"
                        ? "text-yellow-600"
                        : order.status === "cancelled"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {TABS.find(t => t.key === order.status)?.label}
                  </span>
                </div>
                {/* Danh sách sản phẩm trong đơn */}
                {order.items.map((item) => (
                  <div
                    key={item.orderitemid}
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                  >
                    <div className="flex gap-3 items-center">
                      <Link
                        href={`/products/${item.productid}`}
                        className="flex gap-3 items-center hover:bg-gray-50 p-2 rounded-md transition"
                      >
                        {/* Hình ảnh sản phẩm */}
                        <Image
                          src={item.product_image || "/products/pro2.jpg"}
                          alt={item.product_name || "Sản phẩm"}
                          width={80}
                          height={80}
                          className="object-cover rounded-md border"
                        />
                        {/* Thông tin chi tiết */}
                        <div>                        
                          <h4 className="font-bold  text-gray-800">
                            {item.product_name}
                          </h4>
                          <p className="text-sm font-medium text-black">
                          Thương hiệu: {item.brand_name || "Thương hiệu"}
                          </p>
                          <p className="text-sm  text-gray-500">
                            {item.category_name || "Danh mục"}
                          </p>
                          <p className="text-sm text-gray-500">x{item.quantity}</p>
                        </div>
                      </Link>                   
                    </div>

                    {/* Giá và nút hành động */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatVND(item.price)}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => handleReorderProduct(item.productid, item.quantity)}
                          className="px-3 py-1 border rounded-md text-sm text-blue-500 hover:bg-blue-50"
                        >
                          Mua lại
                        </button>
                        {order.status === "delivered" && (
                          <>
                            {item.user_review ? (
                              <div
                                onClick={() =>
                                  router.push(
                                    `/account/review/${item.productid}?edit=true&reviewid=${item.user_review?.reviewid}`
                                  )
                                }
                                className="flex items-center gap-1 cursor-pointer text-yellow-500 hover:text-yellow-600"
                              >
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i}>
                                    {i < (item.user_review?.rating || 0) ? "★" : "☆"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => router.push(`/account/review/${item.productid}`)}
                                className="px-3 py-1 border rounded-md text-sm text-yellow-600 hover:bg-yellow-50"
                              >
                                Đánh giá
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Tổng tiền và hành động đơn hàng */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-b-xl">
                  <p className="text-gray-600">
                    <strong>Thành tiền: </strong>
                    {order.total < order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) ? (
                      // Hiển thị giá gốc bị gạch đi và giá sau giảm
                      <>
                        <span className="line-through text-gray-500">{formatVND(order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                        <span className="text-red-500 font-semibold ml-2">{formatVND(order.total)}</span>
                      </>
                    ) : (
                      // Hiển thị chỉ giá sau giảm nếu không có giảm
                      <span className="text-red-500 font-semibold">{formatVND(order.total)}</span>
                    )}
                  </p>
                  <div className="flex gap-3">
                    {(order.status === 'pending') && (
                      <button
                        onClick={() => handleCancelOrder(order.orderid)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Hủy đơn
                      </button>
                    )}
                    {(order.status === 'cancelled' || order.status === 'delivered') && (
                      <button
                        onClick={() => handleReorderAll(order)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Mua lại toàn bộ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
