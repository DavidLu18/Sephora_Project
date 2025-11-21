"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Tag,
  Users,
  Star,
  Percent,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { label: "Dashboard", icon: <LayoutGrid size={18} />, href: "/dashboard" },
    { label: "Đơn hàng", icon: <ShoppingCart size={18} />, href: "/orders" },
    { label: "Sản phẩm", icon: <Package size={18} />, href: "/products" },
    { label: "Categories & Brand", icon: <Tag size={18} />, href: "/categories-brands" },
    { label: "Khách hàng", icon: <Users size={18} />, href: "/customers" },
    { label: "Câu hỏi & Nhận xét", icon: <Star size={18} />, href: "/reviews-qna" },
    { label: "Khuyến mãi", icon: <Percent size={18} />, href: "/discounts" },
    { label: "Cài đặt", icon: <Settings size={18} />, href: "/settings" },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col gap-6 h-screen sticky top-0">
      <h1 className="text-2xl font-bold tracking-widest text-white">
        SEPHORA
      </h1>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
        ${
          active
            ? "bg-white text-black font-semibold"
            : "text-white/70 hover:bg-white/10"
        }
      `}
    >
      {icon}
      {label}
    </Link>
  );
}
