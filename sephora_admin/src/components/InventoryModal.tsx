"use client";

export type InventoryCheckItem = {
  product_name: string;
  required: number;
  stock: number;
  status: "OK" | "NOT_ENOUGH" | "NOT_FOUND";
};

export type OrderInventoryReport = {
  orderid: number;
  ok: boolean;
  message: string;
  items: InventoryCheckItem[];
};

export type MultiOrderInventoryResult = {
  ok: boolean;
  message: string;
  orders: OrderInventoryReport[];
  combined: {
    product_name: string;
    total_required: number;
    stock: number;
    status: "NOT_ENOUGH";
  }[];
};

export default function MultiOrderInventoryModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: MultiOrderInventoryResult | null;
}) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-2000">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-4xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]">

        <h2 className="text-xl font-semibold text-white mb-4">
          Kiểm tra tồn kho nhiều đơn hàng
        </h2>

        <p className={`font-semibold mb-6 ${data.ok ? "text-green-400" : "text-red-400"}`}>
          {data.message}
        </p>

        {/* ==== HIỂN THỊ CHI TIẾT TỪNG ĐƠN ==== */}
        {data.orders.map((order) => (
          <div key={order.orderid} className="mb-10">
            <h3 className="text-lg font-bold text-white mb-2">
              Đơn #{order.orderid} —{" "}
              {order.ok ? (
                <span className="text-green-400"> Đủ hàng</span>
              ) : (
                <span className="text-red-400"> Thiếu hàng</span>
              )}
            </h3>

            <table className="w-full text-sm border border-white/10 rounded-lg mb-5">
              <thead className="bg-[#222] text-gray-200">
                <tr>
                  <th className="py-2 px-3 text-left">Sản phẩm</th>
                  <th className="py-2 px-3 text-left">Cần</th>
                  <th className="py-2 px-3 text-left">Tồn</th>
                  <th className="py-2 px-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.product_name} className="border-t border-white/10">
                    <td className="py-2 px-3">{item.product_name}</td>
                    <td className="py-2 px-3">{item.required}</td>
                    <td className="py-2 px-3">{item.stock}</td>
                    <td className="py-2 px-3">
                      {item.status === "OK" ? (
                        <span className="text-green-400"> Đủ</span>
                      ) : (
                        <span className="text-red-400"> Thiếu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* ==== BẢNG CỘNG DỒN TỒN KHO ==== */}
        {data.combined.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-red-400 mb-3">
               Thiếu hàng khi gộp tất cả đơn
            </h3>

            <table className="w-full text-sm border border-white/10 rounded-lg">
              <thead className="bg-[#222] text-gray-200">
                <tr>
                  <th className="py-2 px-3 text-left">Sản phẩm</th>
                  <th className="py-2 px-3 text-left">Tổng cần</th>
                  <th className="py-2 px-3 text-left">Tồn</th>
                </tr>
              </thead>
              <tbody>
                {data.combined.map((item) => (
                  <tr key={item.product_name} className="border-t border-white/10">
                    <td className="py-2 px-3">{item.product_name}</td>
                    <td className="py-2 px-3">{item.total_required}</td>
                    <td className="py-2 px-3">{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
