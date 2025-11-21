"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/api/categories";

import {
  getBrands,
  createBrand,
  deleteBrand,
  updateBrand,
} from "@/api/brands";

import { Category } from "@/types/category";
import { Brand } from "@/types/brand";
import EditModal from "@/components/EditModal";
import TreeRow from "@/components/TreeRow";

interface TreeHandlers {
  onEdit: (item: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (id: number) => void;
}

// TREE RENDER FUNCTION
type SortOption = "none" | "az" | "za" | "id_asc" | "id_desc";

export default function CategoriesBrandsPage() {
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<
    "none" | "az" | "za" | "id_asc" | "id_desc"
    >("none");
  // STATES
  const [tab, setTab] = useState<"category" | "brand">("category");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newName, setNewName] = useState("");

  // EDIT MODAL
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // ADD CHILD MODAL
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addParentId, setAddParentId] = useState<number | null>(null);

  // TREE EXPAND STATE
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // LOAD DATA
  const load = useCallback(async () => {
    const [cats, brs] = await Promise.all([getCategories(), getBrands()]);
    setCategories(cats);
    setBrands(brs);
  }, []);

    useEffect(() => {
    (async () => {
        await load();
    })();
    }, [load]);
  // ACTION: Add new category (top-level)
  const handleAddTop = async () => {
    if (!newName.trim()) return;
    await createCategory({ category_name: newName, parent: null });
    setNewName("");
    load();
  };

  // ACTION: Add child (from modal)
  const saveAddChild = async () => {
    if (!addName.trim() || addParentId === null) return;

    await createCategory({
      category_name: addName,
      parent: addParentId,
    });

    setAddOpen(false);
    load();
  };

  // ACTION: Edit category / brand
  const openEdit = (id: number, name: string) => {
    setEditId(id);
    setEditName(name);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;

    if (tab === "category") {
      await updateCategory(editId, { category_name: editName });
    } else {
      await updateBrand(editId, { brand_name: editName });
    }

    setEditOpen(false);
    load();
  };

  // ACTION: Delete
    const handleDelete = async (id: number) => {
        setConfirmDeleteId(id);
    };
    const confirmDelete = async () => {
        if (confirmDeleteId === null) return;

        if (tab === "category") await deleteCategory(confirmDeleteId);
        else await deleteBrand(confirmDeleteId);

        setConfirmDeleteId(null);
        setMessage("Đã xóa thành công!");
        load();

        // Tự ẩn thông báo sau 2 giây
        setTimeout(() => setMessage(null), 2000);
    };
  // ACTION: Add child
  const openAddChild = (parentId: number) => {
    setAddParentId(parentId);
    setAddName("");
    setAddOpen(true);
  };

  function renderTree(
  list: Category[],
  level: number,
  expanded: Record<number, boolean>,
  toggle: (id: number) => void,
  handlers: TreeHandlers
): React.ReactNode[] {
  const rows: React.ReactNode[] = [];

  list.forEach((item) => {
    const isOpen = expanded[item.category_id];

    rows.push(
      <TreeRow
        key={item.category_id}
        item={item}
        level={level}
        expanded={isOpen}
        onToggle={() => toggle(item.category_id)}
        onEdit={() => handlers.onEdit(item)}
        onDelete={() => handlers.onDelete(item.category_id)}
        onAddChild={(parentId) => handlers.onAddChild(parentId)}
      />
    );

    if (isOpen && item.children && item.children.length > 0) {
      rows.push(
        ...renderTree(item.children, level + 1, expanded, toggle, handlers)
      );
    }
  });

  return rows;
}
  // HANDLERS for renderTree
  const treeHandlers: TreeHandlers = {
    onEdit: (item) => openEdit(item.category_id, item.category_name),
    onDelete: handleDelete,
    onAddChild: openAddChild,
  };
// FILTER + SORT CATEGORY (flat)
    const filteredCategories = categories
    .filter((c) =>
        c.category_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
        if (sort === "az") return a.category_name.localeCompare(b.category_name);
        if (sort === "za") return b.category_name.localeCompare(a.category_name);
        if (sort === "id_asc") return a.category_id - b.category_id;
        if (sort === "id_desc") return b.category_id - a.category_id;
        return 0;
    });

    // FILTER + SORT BRAND
    const filteredBrands = brands
    .filter((b) =>
        b.brand_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
        if (sort === "az") return a.brand_name.localeCompare(b.brand_name);
        if (sort === "za") return b.brand_name.localeCompare(a.brand_name);
        if (sort === "id_asc") return a.brand_id - b.brand_id;
        if (sort === "id_desc") return b.brand_id - a.brand_id;
        return 0;
    });
 return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-semibold">Danh mục & Thương hiệu</h1>

      {/* TABS */}
      <div className="flex border-b border-gray-700 w-full mb-4">
        <button
          onClick={() => setTab("category")}
          className={`px-3 pb-2 text-sm font-medium relative ${
            tab === "category" ? "text-white" : "text-gray-400"
          }`}
        >
          Danh mục
          {tab === "category" && (
            <span className="absolute left-0 -bottom-px w-full h-0.5 bg-white"></span>
          )}
        </button>

        <button
          onClick={() => setTab("brand")}
          className={`ml-6 px-3 pb-2 text-sm font-medium relative ${
            tab === "brand" ? "text-white" : "text-gray-400"
          }`}
        >
          Thương hiệu
          {tab === "brand" && (
            <span className="absolute left-0 -bottom-px w-full h-0.5 bg-white"></span>
          )}
        </button>
         </div>
        {/* SEARCH + SORT + ADD (1 dòng) */}
        <div className="flex items-center gap-3 mb-4 mt-2">

            {/* SEARCH */}
            <input
                className="bg-black/20 px-3 py-2 border border-gray-700 rounded-lg text-sm w-64"
                placeholder={tab === "category" ? "Tìm danh mục…" : "Tìm thương hiệu…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* SORT */}
            <select
                className="bg-black/20 px-3 py-2 border border-gray-700 rounded-lg text-sm"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
            >
                <option value="none">Mặc định</option>
                <option value="az">Tên A → Z</option>
                <option value="za">Tên Z → A</option>
                <option value="id_asc">ID tăng dần</option>
                <option value="id_desc">ID giảm dần</option>
            </select>

            {/* ADD INPUT */}
            <input
                className="bg-black/20 px-3 py-2 border border-gray-700 rounded-lg text-sm w-64"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={tab === "category" ? "Tên danh mục mới…" : "Tên thương hiệu mới…"}
            />

            {/* ADD BUTTON */}
            {tab === "category" ? (
                <button
                    onClick={handleAddTop}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm whitespace-nowrap"
                >
                    + Thêm danh mục
                </button>
            ) : (
                <button
                    onClick={async () => {
                        await createBrand({ brand_name: newName });
                        setNewName("");
                        load();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm whitespace-nowrap"
                >
                    + Thêm thương hiệu
                </button>
            )}

        </div>

      

      {/* TABLE */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left w-24">ID</th>
              <th className="p-3 text-left w-40">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {tab === "category" &&
              renderTree(filteredCategories, 0, expanded, toggle, treeHandlers)}

            {tab === "brand" &&
              filteredBrands.map((b) => (
                <tr
                  key={b.brand_id}
                  className="border-b border-gray-800 hover:bg-gray-900/40 transition"
                >
                  <td className="p-3">
                    <span className="px-3 py-1 text-xs bg-gray-900/60 border border-gray-700 rounded-lg">
                      {b.brand_name}
                    </span>
                  </td>
                  <td className="p-3">{b.brand_id}</td>
                  <td className="p-3">
                    <button
                      onClick={() => openEdit(b.brand_id, b.brand_name)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-blue-500 text-blue-300 hover:bg-blue-600/20"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(b.brand_id)}
                      className="ml-2 px-3 py-1.5 text-xs rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      <EditModal
        open={editOpen}
        value={editName}
        onChange={setEditName}
        onSave={saveEdit}
        onClose={() => setEditOpen(false)}
        title="Chỉnh sửa"
      />

      {/* ADD CHILD MODAL */}
      <EditModal
        open={addOpen}
        value={addName}
        onChange={setAddName}
        onSave={saveAddChild}
        onClose={() => setAddOpen(false)}
        title="Thêm danh mục con"
      />

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-700 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Xác nhận xoá</h2>
            <p className="text-sm text-gray-300 mb-6">
              Bạn có chắc chắn muốn xóa mục này?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TOAST MESSAGE ===================== */}
      {message && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {message}
        </div>
      )}
    </div>
  );
}