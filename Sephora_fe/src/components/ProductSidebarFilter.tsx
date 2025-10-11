"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Category } from "@/types/category"
import { Brand } from "@/types/brand"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getBrands, getCategories } from "@/api"

interface ProductSidebarFilterProps {
  onFilterChange: (
    filters: Partial<{
      categoryId: number | null
      minPrice: number | null
      maxPrice: number | null
      sortBy: string
      brands: number[]
      rating: number | null
    }>
  ) => void
  filters: {
    categoryId: number | null
    minPrice: number | null
    maxPrice: number | null
    sortBy: string
    brands: number[]
    rating: number | null
  }
  onClearFilters: () => void
}

export default function ProductSidebarFilter({
  onFilterChange,
  filters,
}: ProductSidebarFilterProps) {
  const router = useRouter()
  const params = useParams()
  const selectedCategoryId = params.category_id ? String(params.category_id) : null // Sử dụng category_id từ route

  const [openSection, setOpenSection] = useState<string | null>(null)
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [currentDisplayName, setCurrentDisplayName] = useState<string>("Tất cả sản phẩm")
  const [subCategories, setSubCategories] = useState<Category[]>([])

  // Lấy thương hiệu
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data: Brand[] = await getBrands()
        const formatted = data.map((b) => ({
          id: b.brand_id,
          name: b.brand_name,
        }))
        setBrands(formatted)
      } catch (err) {
        console.error("❌ Lỗi khi tải thương hiệu:", err)
      }
    }
    fetchBrands()
  }, [])

  // Hàm đệ quy để tìm danh mục và đường dẫn cha (parentPath: bậc 1 ở index 0, bậc 2 ở index 1, v.v.)
  const findCategory = useCallback((categories: Category[], id: string): { category: Category | null; parentPath: Category[] } => {
    for (const cat of categories) {
      if (String(cat.category_id) === id) {
        return { category: cat, parentPath: [] }
      }
      if (cat.children) {
        const result = findCategory(cat.children, id)
        if (result.category) {
          return { category: result.category, parentPath: [cat, ...result.parentPath] }
        }
      }
    }
    return { category: null, parentPath: [] }
  }, []);

  // Lấy danh mục và xử lý hiển thị
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data: Category[] = await getCategories()
        console.log("Dữ liệu từ getCategories:", data) // Log dữ liệu API

        if (selectedCategoryId) {
          const { category, parentPath } = findCategory(data, selectedCategoryId)
          console.log("Kết quả findCategory - Category:", category, "ParentPath:", parentPath) // Log kết quả tìm kiếm

          if (category) {
            setCurrentDisplayName(category.category_name) // Tiêu đề luôn là tên category hiện tại

            // Logic hiển thị subCategories theo cấp bậc
            if (parentPath.length === 0) {
              // Bậc 1 (root): hiển thị bậc 2 (children của nó)
              setSubCategories(category.children || [])
              console.log("Bậc 1 - Sub Categories (bậc 2):", category.children)
            } else if (parentPath.length === 1) {
              // Bậc 2: hiển thị bậc 3 (children của nó)
              setSubCategories(category.children || [])
              console.log("Bậc 2 - Sub Categories (bậc 3):", category.children)
            } else {
              // Bậc 3 hoặc sâu hơn: không hiển thị subCategories
              setSubCategories([])
              console.log("Bậc 3+ - Không có sub categories")
            }
          } else {
            setCurrentDisplayName("Tất cả sản phẩm")
            setSubCategories([])
            console.log("Không tìm thấy category, set Sub Categories rỗng")
          }
        } else {
          setCurrentDisplayName("Tất cả sản phẩm")
          const allSubCategories = data.flatMap((c) => c.children || [])
          setSubCategories(allSubCategories)
          console.log("Không có selectedCategoryId, Sub Categories:", allSubCategories)
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh mục:", err)
        setCurrentDisplayName("Tất cả sản phẩm")
        setSubCategories([])
      }
    }
    fetchCategories()
  }, [selectedCategoryId, findCategory])

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key))
  }

  // Khi chọn danh mục, cập nhật URL và filters
  const handleCategorySelect = (id: number) => {
    const currentPath = `/shop/${id}`
    router.push(currentPath)
    onFilterChange({ ...filters, categoryId: id })
  }

  return (
    <aside
      className="w-60 h-[80vh] sticky top-24 overflow-y-auto pr-3 border-r
                 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
    >
      {/* Danh mục chính */}
      <h2 className="text-2xl font-bold mb-4">
        {currentDisplayName}
      </h2>
      {/* Danh mục con */}
      <ul className="space-y-1 mb-6">
        {subCategories.length > 0 ? (
          subCategories.map((cat) => (
            <li key={cat.category_id}>
              <button
                onClick={() => handleCategorySelect(cat.category_id)}
                className={`text-left w-full hover:underline ${
                  String(cat.category_id) === selectedCategoryId
                    ? "font-semibold text-black"
                    : "text-gray-700"
                }`}
              >
                {cat.category_name}
              </button>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-sm mb-6"></p>
        )}
      </ul>

      {/* Bộ lọc */}
      <h3 className="text-gray-600 text-sm mb-3">Bộ lọc</h3>
      <div className="space-y-2 text-sm">
        {[{ key: "price", title: "Giá bán" }, { key: "brand", title: "Thương hiệu" }, { key: "rating", title: "Đánh giá" }, { key: "sale", title: "Sale" }].map(
          (section) => (
            <div key={section.key} className="border-b pb-1">
              <button
                onClick={() => toggleSection(section.key)}
                className="flex justify-between items-center w-full font-semibold py-2 hover:text-black"
              >
                <span>{section.title}</span>
                {openSection === section.key ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {openSection === section.key && (
                <div className="pl-2 py-2 space-y-2 text-gray-600">
                  {/* Giá bán */}
                  {section.key === "price" && (
                    <div className="space-y-2">
                      {[{ label: "Under $25", min: 0, max: 25 }, { label: "$25 to $50", min: 25, max: 50 }, { label: "$50 to $100", min: 50, max: 100 }, { label: "$100 and above", min: 100, max: null }].map(
                        (range) => (
                          <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="priceRange"
                              className="accent-black"
                              onChange={() =>
                                onFilterChange({
                                  ...filters,
                                  minPrice: range.min,
                                  maxPrice: range.max,
                                })
                              }
                              checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                            />
                            <span>{range.label}</span>
                          </label>
                        )
                      )}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          placeholder="$ Min"
                          className="w-1/2 border rounded p-1 text-xs"
                          value={filters.minPrice ?? ""}
                          onChange={(e) =>
                            onFilterChange({
                              ...filters,
                              minPrice: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        />
                        <input
                          type="number"
                          placeholder="$ Max"
                          className="w-1/2 border rounded p-1 text-xs"
                          value={filters.maxPrice ?? ""}
                          onChange={(e) =>
                            onFilterChange({
                              ...filters,
                              maxPrice: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Đánh giá */}
                  {section.key === "rating" && (
                    <ul className="space-y-1">
                      {[5, 4, 3].map((r) => (
                        <li key={r}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="rating"
                              className="accent-black"
                              checked={filters.rating === r}
                              onChange={() =>
                                onFilterChange({
                                  ...filters,
                                  rating: filters.rating === r ? null : r,
                                })
                              }
                            />
                            <span>{r} sao trở lên</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Thương hiệu */}
                  {section.key === "brand" && (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {brands.length > 0 ? (
                        brands.map((brand) => (
                          <label key={brand.id} className="flex items-center gap-2 cursor-pointer text-gray-700">
                            <input
                              type="checkbox"
                              className="accent-black"
                              checked={filters.brands.includes(brand.id)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...filters.brands, brand.id]
                                  : filters.brands.filter((id) => id !== brand.id)
                                onFilterChange({ ...filters, brands: updated })
                              }}
                            />
                            <span>{brand.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-gray-500 text-xs italic">Đang tải thương hiệu...</p>
                      )}
                    </div>
                  )}

                  {/* Sale */}
                  {section.key === "sale" && (
                    <div className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-black"
                        checked={filters.sortBy === "sale"}
                        onChange={(e) =>
                          onFilterChange({
                            ...filters,
                            sortBy: e.target.checked ? "sale" : "",
                          })
                        }
                      />
                      <span>Sale</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </aside>
  )
}