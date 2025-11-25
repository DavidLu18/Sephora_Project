"use client";

import { useEffect, useState } from "react";
import { PaymentMethod } from "@/types/payment";
import {
    getPaymentMethods,
    deletePaymentMethod,
    setDefaultPaymentMethod
} from "@/api/index";

export default function PaymentList() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const loadData = async () => {
        try {
            const data = await getPaymentMethods();
            setMethods(data);
        } catch (error) {
            console.error("Lỗi khi tải phương thức thanh toán:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deletePaymentMethod(id);
            loadData();
        } catch (error) {
            console.error("Lỗi khi xóa phương thức:", error);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await setDefaultPaymentMethod(id);
            loadData();
        } catch (error) {
            console.error("Lỗi khi đặt mặc định:", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <div className="space-y-4">
            {methods.map((m) => (
                <div
                    key={m.id}
                    className="border p-4 rounded-lg flex items-center justify-between"
                >
                    <div>
                        <p className="font-semibold">{m.display_name}</p>
                        <p className="text-sm text-gray-500">{m.method_type}</p>

                        {m.is_default && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                Mặc định
                            </span>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {!m.is_default && (
                            <button
                                onClick={() => handleSetDefault(m.id)}
                                className="text-blue-600"
                            >
                                Đặt làm mặc định
                            </button>
                        )}

                        <button
                            onClick={() => handleDelete(m.id)}
                            className="text-red-600"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
