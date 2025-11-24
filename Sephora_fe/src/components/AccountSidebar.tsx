"use client";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const menuItems = [
  { label: "Thông tin tài khoản", path: "/account/info_account" },
  { label: "Đơn hàng gần đây", path: "/account/orders" },
  { label: "Địa chỉ giao hàng", path: "/account/address" },
  { label: "Thanh toán & tín dụng", path: "/account/payment" },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-1/4 border-r pr-6">
      <h2 className="font-bold text-lg mb-4">Tài khoản của tôi</h2>
      <ul className="space-y-2 text-sm">
        {menuItems.map((item) => (
          <li
            key={item.path}
            onClick={() => router.push(item.path)}
            className={clsx(
              "cursor-pointer py-2 px-3 rounded-md transition-colors",
              pathname === item.path
                ? "bg-black text-white font-medium"
                : "hover:bg-gray-100 text-gray-700"
            )}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
