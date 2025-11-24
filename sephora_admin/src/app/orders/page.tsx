"use client";

import { useEffect, useState } from "react";
import { AdminOrder } from "@/types/orders";
import Link from "next/link";
import { Search } from "lucide-react";
import { 
  getAdminOrders,
  // updateAdminOrderStatus,
  bulkUpdateAdminOrders,
  bulkDeleteAdminOrders,
  checkAdminOrders
} from "@/api/orders";
import InventoryModal, { MultiOrderInventoryResult  } from "@/components/InventoryModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function OrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [statFilter, setStatFilter] = useState("");
    const [checkModalOpen, setCheckModalOpen] = useState(false);
    const [checkResult, setCheckResult] = useState<MultiOrderInventoryResult  | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const resetFilters = () => {
        setSearch("");
        setStatusFilter("");
        setPaymentFilter("");
        setDateFilter("");
    };
    const openConfirm = (title: string, message: string, action: () => void) => {
      setConfirmTitle(title);
      setConfirmMessage(message);
      setConfirmAction(() => action);
      setConfirmOpen(true);
    };

  useEffect(() => {
    getAdminOrders().then(setOrders);
  }, []);
  const canDelete = selectedOrders.length > 0 && 
                  selectedOrders.every(id => {
                    const ord = orders.find(o => o.orderid === id);
                    return ord?.status === "pending";
                  });

  // === STATISTICS ===
  const stats = {
    new: orders.filter((o) => o.status === "pending").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    shipping: orders.filter((o) => o.status === "shipping").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };
  const toggleSelectOrder = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
      setSelectAll(false);
    } else {
      const allIds = filtered.map((o) => o.orderid);
      setSelectedOrders(allIds);
      setSelectAll(true);
    }
  };

  const handleUpdateStatusClick = (status: string) => {
    if (selectedOrders.length === 0) return;

    openConfirm(
      "Xác nhận đơn hàng",
      `Cập nhật ${selectedOrders.length} đơn hàng sang trạng thái "${status}"?`,
      () => doUpdateStatus(status)
    );
  };

  const doUpdateStatus = async (status: string) => {
    try {
      await bulkUpdateAdminOrders(selectedOrders, status);

      const updated = orders.map((o) =>
        selectedOrders.includes(o.orderid) ? { ...o, status } : o
      );

      setOrders(updated);
      setSelectedOrders([]);
      setSelectAll(false);
      setConfirmOpen(false);

      alert("Cập nhật trạng thái thành công!");
    } catch (error: unknown) {
      if (error instanceof Response) {
        try {
          const errData = await error.json() as { message?: string };
          alert(errData.message ?? "Không thể cập nhật đơn hàng!");
        } catch {
          alert("Lỗi không xác định từ server!");
        }
        return;
      }

      if (error instanceof Error) alert(error.message);
      else alert("Không thể cập nhật đơn hàng!");
    }
  };

  const handleDeleteClick = () => {
    if (selectedOrders.length === 0) return;

    openConfirm(
      "Xóa đơn hàng",
      `Bạn có chắc muốn xóa ${selectedOrders.length} đơn hàng?`,
      () => doDelete()   // 👉 chỉ gọi hàm thực hiện
    );
  };
  const doDelete = async () => {
  try {
    await bulkDeleteAdminOrders(selectedOrders);

    const updated = orders.filter(
      (o) => !selectedOrders.includes(o.orderid)
    );

    setOrders(updated);
    setSelectedOrders([]);
    setSelectAll(false);
    setConfirmOpen(false);

    alert("Đã xóa đơn hàng!");
  } catch (err) {
    console.error(err);
    alert("Xóa thất bại!");
  }
};


  const handleCheckOrder = async () => {
    if (selectedOrders.length === 0) {
      setCheckResult({
        ok: false,
        message: "Bạn chưa chọn đơn nào!",
        orders: [],
        combined: []
      });
      setCheckModalOpen(true);
      return;
    }

    const result = await checkAdminOrders(selectedOrders);
    setCheckResult(result);
    setCheckModalOpen(true);
  };





  // === FILTER ===
  const filtered = orders.filter((o) => {
    const matchSearch =
        o.orderid.toString().includes(search) ||
        o.user_email?.toLowerCase().includes(search.toLowerCase());

    // ƯU TIÊN statFilter trước
    const matchStatus =
        statFilter
        ? o.status === statFilter
        : statusFilter
        ? o.status === statusFilter
        : true;

    const matchPayment =
        !paymentFilter || o.payment_method === paymentFilter;

    const matchDate =
        !dateFilter ||
        new Date(o.createdat).toISOString().slice(0, 10) === dateFilter;

    return matchSearch && matchStatus && matchPayment && matchDate;
    });


  return (
    <div className="space-y-6">
      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="text-gray-400">Order management panel</p>
      </div>

    {/* ====================== */}
    {/*     TOP STAT CARDS     */}
    {/* ====================== */}
    {/* ======= TOP STATISTICS CARDS ======= */}
    <div className="grid grid-cols-4 gap-5 mt-3">
        <button 
            onClick={() => setStatFilter("")}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
            >
            Bỏ lọc thống kê
        </button>
    </div>    
    <div className="grid grid-cols-4 gap-5 mt-3">
        <div
            onClick={() => setStatFilter("pending")}
            className={`cursor-pointer bg-linear-to-r from-yellow-500 to-yellow-600 p-5 rounded-xl shadow 
            ${statFilter === "pending" ? "ring-4 ring-pink-500" : ""}`}
        >
            <p className="text-white text-lg font-semibold">ĐƠN HÀNG MỚI</p>
            <p className="text-white/80">Tổng đơn hàng: {stats.new}</p>
            
        </div>
        <div
            onClick={() => setStatFilter("shipping")}
            className={`cursor-pointer bg-linear-to-r from-sky-500 to-sky-600 p-5 rounded-xl shadow
            ${statFilter === "shipping" ? "ring-4 ring-pink-500" : ""}`}
        >
            <p className="text-white text-lg font-semibold">ĐANG VẬN CHUYỂN</p>
            <p className="text-white/80">Tổng đơn hàng: {stats.shipping}</p>
        </div>

        <div
            onClick={() => setStatFilter("delivered")}
            className={`cursor-pointer bg-linear-to-r from-green-500 to-green-600 p-5 rounded-xl shadow
            ${statFilter === "delivered" ? "ring-4 ring-pink-500" : ""}`}
        >
            <p className="text-white text-lg font-semibold">HOÀN TẤT</p>
            <p className="text-white/80">Tổng đơn hàng: {stats.delivered}</p>
        </div>
        <div
            onClick={() => setStatFilter("cancelled")}
            className={`cursor-pointer bg-linear-to-r from-red-500 to-red-600 p-5 rounded-xl shadow
            ${statFilter === "cancelled" ? "ring-4 ring-pink-500" : ""}`}
            >
            <p className="text-white text-lg font-semibold">ĐÃ HỦY</p>
            <p className="text-white/80">Tổng đơn hàng: {stats.cancelled}</p>
            
        </div>
        
    </div>
    


      {/* ====================== */}
      {/*       FILTER BAR       */}
      {/* ====================== */}
      <div
        className="
        bg-[#121212]
        border border-white/10
        shadow-[0_0_35px_rgba(255,255,255,0.05)]
        rounded-2xl
        p-5
        flex flex-wrap
        gap-4
      "
      >
        {/* SEARCH BAR */}
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            placeholder="Tìm kiếm đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full bg-[#1a1a1a]
              border border-white/10 
              rounded-lg pl-10 pr-4 py-2 
              text-gray-200
              focus:outline-none 
              focus:border-pink-600
            "
          />
        </div>

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="
          bg-[#1a1a1a] border border-white/10 text-gray-300 
          px-4 py-2 rounded-lg focus:outline-none focus:border-pink-600
        "
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Đợi xử lý</option>
          <option value="shipping">Đang vận chuyển</option>
          <option value="delivered">Đã vận chuyển</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        {/* PAYMENT FILTER */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="
          bg-[#1a1a1a] border border-white/10 text-gray-300 
          px-4 py-2 rounded-lg focus:outline-none focus:border-pink-600
        "
        >
          <option value="">All Payments</option>
          <option value="COD">COD</option>
          <option value="Thanh toán khi nhận hàng">
            Thanh toán khi nhận hàng
          </option>
        </select>

        {/* DATE FILTER */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="
            bg-[#1a1a1a] 
            border border-white/10 
            text-gray-300 
            px-4 py-2 rounded-lg
            focus:outline-none focus:border-pink-600
          "
        />

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
        >
          Xóa lọc
        </button>
      </div>
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 mt-4">

          {canDelete && (
            <button
              onClick={handleDeleteClick}
              className="
                bg-pink-600 hover:bg-pink-700 
                text-white px-4 py-2 rounded-lg 
                font-medium shadow transition
              "
            >
              Xóa {selectedOrders.length} đơn hàng
            </button>
          )}
          <button
            onClick={() => handleUpdateStatusClick("shipping")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Xác nhận đơn
          </button>
          <button
            onClick={handleCheckOrder}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
          >
            Kiểm tra đơn
          </button>
          <span className="text-gray-400 text-sm">
            ({selectedOrders.length} đơn được chọn)
          </span>
        </div>
      )}

        {/* ====================== */}
        {/*     ORDERS TABLE       */}
        {/* ====================== */}
        <div
        className="
            bg-[#121212]
            border border-white/10
            rounded-2xl 
            shadow-[0_0_40px_rgba(255,255,255,0.05)]
            overflow-hidden
        "
        >
        <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-[#1a1a1a] border-b border-white/10 text-gray-400">
            <tr>
                <th className="py-4 px-6">
                <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-pink-500"
                />
                </th>

                <th className="py-4 px-6 text-left">Đơn hàng</th>
                <th className="py-4 px-6 text-left">Ngày đặt</th>
                <th className="py-4 px-6 text-left">Khách hàng</th>
                <th className="py-4 px-6 text-left">Sản phẩm</th>
                <th className="py-4 px-6 text-left">Tổng tiền</th>
                <th className="py-4 px-6 text-left">Thanh toán</th>
                <th className="py-4 px-6 text-left">Trạng thái</th>
                <th className="py-4 px-6"></th>
            </tr>
            </thead>

            <tbody>
            {filtered.map((o) => (
                <tr
                key={o.orderid}
                className="
                    border-t border-white/5 
                    hover:bg-white/5 
                    transition
                "
                >
                <td className="py-5 px-6">
                    <input
                    type="checkbox"
                    checked={selectedOrders.includes(o.orderid)}
                    onChange={() => toggleSelectOrder(o.orderid)}
                    className="w-4 h-4 accent-pink-500"
                    />
                </td>

                <td className="py-5 px-6">
                    <span className="text-pink-500 font-semibold">
                    #{o.orderid}
                    </span>
                </td>

                <td className="py-5 px-6">
                    {new Date(o.createdat).toLocaleString("vi-VN")}
                </td>

                <td className="py-5 px-6">
                    <p className="font-semibold text-white">{o.user_email}</p>
                    <p className="text-xs text-gray-400">Địa chỉ: (fetch sau)</p>
                </td>

                <td className="py-5 px-6">
                    <p className="font-semibold text-gray-200">{o.items?.length} sản phẩm</p>
                    <p className="text-xs text-gray-400">(chi tiết sản phẩm)</p>
                </td>

                <td className="py-5 px-6 font-semibold text-gray-100">
                    {o.total}đ
                </td>

                <td className="py-5 px-6 text-gray-300">
                    {o.payment_method}
                </td>

                <td className="py-5 px-6">
                    <span
                    className={`px-3 py-1 text-xs rounded-full ${
                        o.status === "delivered"
                        ? "bg-green-500/20 text-green-400"
                        : o.status === "shipping"
                        ? "bg-blue-500/20 text-blue-400"
                        : o.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                    >
                    {o.status}
                    </span>
                </td>

                <td className="py-5 px-6">
                    <Link
                    href={`/orders/${o.orderid}`}
                    className="text-pink-500 hover:underline"
                    >
                    Chi tiết →
                    </Link>
                </td>
                </tr>
            ))}
            </tbody>
        </table>

        {/* No Results */}
        {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">
            Không có đơn hàng nào.
            </div>
        )}
        </div>
        <InventoryModal
          open={checkModalOpen}
          onClose={() => setCheckModalOpen(false)}
          data={checkResult}
        />
        <ConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmAction}
          title={confirmTitle}
          message={confirmMessage}
        />
    </div>  
  ); 
}
