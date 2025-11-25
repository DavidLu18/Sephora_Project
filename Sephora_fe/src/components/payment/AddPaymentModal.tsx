"use client";

import { useState } from "react";
import { addPaymentMethod } from "@/api/index";

interface Props {
    open: boolean;
    onClose: () => void;
    onAdded: () => void;
}

export default function AddPaymentModal({ open, onClose, onAdded }: Props) {
    const [methodType, setMethodType] = useState<"credit_card" | "vnpay_wallet">("credit_card");
    const [cardNumber, setCardNumber] = useState("");
    const [cardBrand, setCardBrand] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    if (!open) return null;

    const last4 = cardNumber.slice(-4);

    const displayName =
        methodType === "credit_card" && last4 && cardBrand
            ? `${cardBrand.toUpperCase()} •••• ${last4}`
            : methodType === "vnpay_wallet"
            ? "Ví VNPay"
            : "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            method_type: methodType ,
            display_name: displayName,
            card_last4: methodType === "credit_card" ? last4 : "",
            card_brand: methodType === "credit_card" ? cardBrand : "",
            fake_token: "demo_token_123",
            is_default: isDefault,
        };

        await addPaymentMethod(payload);

        onAdded();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Thêm phương thức thanh toán</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <label className="block">
                        <p className="text-sm font-medium mb-1">Phương thức</p>
                        <select
                            value={methodType}
                            onChange={(e) =>
                                setMethodType(e.target.value as "credit_card" | "vnpay_wallet")
                            }
                            className="border px-3 py-2 rounded-lg w-full"
                        >
                            <option value="credit_card">Thẻ tín dụng / ghi nợ</option>
                            <option value="vnpay_wallet">Ví VNPay</option>
                        </select>
                    </label>

                    {methodType === "credit_card" && (
                        <>
                            <label className="block">
                                <p className="text-sm font-medium">Số thẻ</p>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="border px-3 py-2 rounded-lg w-full"
                                    required
                                />
                            </label>

                            <label className="block">
                                <p className="text-sm font-medium">Thương hiệu thẻ</p>
                                <input
                                    type="text"
                                    value={cardBrand}
                                    onChange={(e) => setCardBrand(e.target.value)}
                                    className="border px-3 py-2 rounded-lg w-full"
                                    placeholder="VISA, Mastercard..."
                                    required
                                />
                            </label>
                        </>
                    )}

                    <div className="text-gray-600 text-sm italic">
                        {displayName && (
                            <p>
                                Hiển thị:{" "}
                                <span className="font-medium">{displayName}</span>
                            </p>
                        )}
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                        />
                        <span>Đặt làm mặc định</span>
                    </label>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white rounded-lg"
                        >
                            Thêm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
