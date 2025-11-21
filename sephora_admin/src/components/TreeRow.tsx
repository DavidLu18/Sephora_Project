"use client";

import React from "react";
import { Category } from "@/types/category";
import { ChevronRightIcon, ChevronDownIcon, Plus } from "lucide-react";

interface TreeRowProps {
  item: Category;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: (parentId: number) => void; 
}

export default function TreeRow({
  item,
  level,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: TreeRowProps) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-900/40 transition">
      <td className="p-3">
        <div className="flex items-center gap-2" style={{ paddingLeft: level * 20 }}>
          {hasChildren ? (
            <button onClick={onToggle} className="text-gray-400 hover:text-gray-200">
              {expanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
            </button>
          ) : (
            <div style={{ width: 16 }} />
          )}

          <span className="px-3 py-1 rounded-lg bg-gray-900/60 border border-gray-700 text-xs">
            {item.category_name}
          </span>

          {level < 2 && (
            <button
                onClick={() => onAddChild(item.category_id)}
                className="ml-2 text-pink-400 hover:text-green-300"
                title="Thêm danh mục con"
            >
            <Plus size={14} />
            </button>
          )}
        </div>
      </td>

      <td className="p-3">{item.category_id}</td>

      <td className="p-3">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-xs rounded-lg border border-blue-500 text-blue-300"
          >
            Sửa
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/15 text-red-300"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}
