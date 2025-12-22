"use client";
import { useState } from "react";

interface IssueModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function IssueModal({ open, onClose, onSubmit }: IssueModalProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] p-6 rounded-lg w-96 shadow-lg border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-3">
          Báo sự cố đơn hàng
        </h2>

        <textarea
          placeholder="Nhập lý do (ví dụ: hết hàng, mất hàng, lỗi kho...)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="
            w-full h-28 
            bg-black/20 text-gray-200 
            border border-white/10 rounded 
            p-3 outline-none 
            focus:border-pink-500
          "
        />

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Hủy
          </button>

          <button
            onClick={() => {
              if (!reason.trim()) {
                alert("Vui lòng nhập lý do!");
                return;
              }
              onSubmit(reason);
              setReason("");
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Gửi thông báo
          </button>
        </div>
      </div>
    </div>
  );
}
