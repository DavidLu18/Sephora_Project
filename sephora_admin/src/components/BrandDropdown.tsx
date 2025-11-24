"use client";

import { useState } from "react";
import type { Brand } from "@/types";

interface Props {
  brands: Brand[];
  selected: number[];
  onChange: (values: number[]) => void;
}

export default function BrandDropdown({ brands, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = brands.filter((b) =>
    b.brand_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="mb-4">
      <p className="text-gray-300 mb-1">Chọn thương hiệu</p>

      <div
        className="bg-black border border-gray-700 p-2 rounded cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0
          ? "— Chưa chọn —"
          : `${selected.length} thương hiệu đã chọn`}
      </div>

      {open && (
        <div className="mt-2 bg-[#1a1a1a] border border-gray-800 p-3 rounded max-h-80 overflow-y-auto">
          <input
            className="w-full bg-black border border-gray-700 p-2 rounded mb-2"
            placeholder="Tìm kiếm thương hiệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.map((b) => (
            <label key={b.brand_id} className="flex gap-2 items-center mb-1">
              <input
                type="checkbox"
                checked={selected.includes(b.brand_id)}
                onChange={() => toggle(b.brand_id)}
              />
              {b.brand_name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
