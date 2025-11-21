"use client";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-3000">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-1">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            Hủy
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
