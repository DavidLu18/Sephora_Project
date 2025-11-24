"use client";

interface EditModalProps {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  title?: string; 
}

export default function EditModal({
  open,
  value,
  onChange,
  onSave,
  onClose,
  title,
}: EditModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 w-[380px] shadow-xl">
        <h2 className="text-lg font-semibold mb-4">
            {title || "Chỉnh sửa"}
        </h2>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-800">
            Hủy
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm rounded-lg bg-pink-600 text-white"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
