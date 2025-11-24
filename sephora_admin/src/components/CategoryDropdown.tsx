"use client";

import { useState } from "react";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  selected: number[];
  onChange: (values: number[]) => void;
}

function CategoryNode({
  node,
  selected,
  onToggle,
}: {
  node: Category;
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-2">
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-400 hover:text-white"
          >
            {open ? "▼" : "▶"}
          </button>
        )}

        <input
          type="checkbox"
          checked={selected.includes(node.category_id)}
          onChange={() => onToggle(node.category_id)}
        />

        <span>{node.category_name}</span>
      </div>

      {open &&
        hasChildren &&
        node.children!.map((child) => (
          <CategoryNode
            key={child.category_id}
            node={child}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

export default function CategoryDropdown({
  categories,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="mb-4">
      <p className="text-gray-300 mb-1">Chọn danh mục</p>

      <div
        className="bg-black border border-gray-700 p-2 rounded cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0
          ? "— Chưa chọn —"
          : `${selected.length} danh mục đã chọn`}
      </div>

      {open && (
        <div className="mt-2 bg-[#1a1a1a] border border-gray-800 p-3 rounded max-h-80 overflow-y-auto">
          {categories.map((c) => (
            <CategoryNode
              key={c.category_id}
              node={c}
              selected={selected}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
