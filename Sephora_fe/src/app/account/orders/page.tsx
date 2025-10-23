'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { addToCart, cancelOrder } from '@/api'; // import addToCart và cancelOrder từ API

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
        <div className="p-6 text-center text-gray-500">Không có đơn hàng {TABS.find(t => t.key === activeTab)?.label.toLowerCase()}.</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.orderid} className="border border-gray-200 rounded-xl shadow-sm p-4">
              <p><strong>Ngày tạo:</strong> {new Date(order.createdat).toLocaleDateString()}</p>
              <p><strong>Tổng tiền: </strong> {order.total}$</p>

              <h3 className="font-semibold mt-3">Sản phẩm trong đơn:</h3>
              <ul className="list-disc pl-5">
                {order.items.map((item) => (
                  <li key={item.orderitemid} className="flex justify-between items-center py-1">
                    <span>Sản phẩm #{item.productid} x{item.quantity} - {item.price} $</span>
                    {(order.status === 'pending'|| 'cancelled') && (
                      <button
                        onClick={() => handleReorderProduct(item.productid, item.quantity)}
                        className="text-blue-500 hover:underline"
                      >
                        Mua lại
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* Thêm nút mua lại toàn bộ và hủy đơn hàng */}
              {(order.status === 'pending')&& (
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => handleReorderAll(order)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Mua lại toàn bộ
                  </button>

                  <button
                    onClick={() => handleCancelOrder(order.orderid)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Hủy đơn hàng
                  </button>
                </div>
              )}

              {/* Thêm nút mua lại cho đơn hàng đã hủy */}
              {order.status === 'cancelled' && (
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => handleReorderAll(order)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Mua lại toàn bộ
                  </button>

                 
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
