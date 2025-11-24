"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation" 
import { getCategories } from "@/api"
import type { Category } from "@/types/category"

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [hovering, setHovering] = useState(false)
  const pathname = usePathname() //  hook này giúp biết route hiện tại

  // Lấy danh mục (chạy 1 lần)
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => {
        // Xử lý lỗi khi người dùng chưa đăng nhập
        console.error("Lỗi khi tải danh mục:", err.message);
        if (err.message === "Người dùng chưa đăng nhập") {
          // Có thể hiển thị thông báo lỗi hoặc chuyển hướng đến trang đăng nhập
          alert("Vui lòng đăng nhập để tiếp tục.");
        }
      });
  }, []);

  
  useEffect(() => {
    setHovering(false)
    setActiveCategory(null)
  }, [pathname]) 

  const currentCategory = categories.find(
    (cat) => cat.category_id === activeCategory
  )
  const hasChildren = currentCategory && currentCategory.children?.length > 0

  return (
    <div
      className="relative z-[1500]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setActiveCategory(null)
      }}
    >
      <nav className="relative bg-black text-white text-sm font-medium">
        <ul className="flex justify-center gap-6 px-6 py-3 whitespace-nowrap overflow-visible">
          {categories.map((cat) => (
            <li
              key={cat.category_id}
              className="cursor-pointer hover:text-gray-300 transition-colors duration-150"
              onMouseEnter={() => setActiveCategory(cat.category_id)}
            >
              <Link href={`/shop/${cat.category_id}`} className="block px-1">
                {cat.category_name}
              </Link>
            </li>
          ))}
        </ul>

        {hovering && hasChildren && (
          <div className="absolute left-0 top-full w-screen bg-white text-black shadow-2xl border-t border-gray-200 z-[1400]">
            <div className="mx-auto max-w-6xl px-8 py-6 grid grid-cols-4 gap-8">
              {currentCategory?.children?.map((child) => (
                <div key={child.category_id}>
                  <Link
                    href={`/shop/${child.category_id}`}
                    className="font-semibold text-gray-800 mb-2 block hover:text-pink-600 transition-colors"
                  >
                    {child.category_name}
                  </Link>
                  {child.children && child.children.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm text-gray-600">
                      {child.children.map((sub) => (
                        <li key={sub.category_id}>
                          <Link
                            href={`/shop/${sub.category_id}`}
                            className="hover:text-pink-600 cursor-pointer transition-colors"
                          >
                            {sub.category_name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
