"use client";

import { useState } from "react";
import AddPaymentModal from "@/components/payment/AddPaymentModal";
import PaymentList from "@/components/payment/PaymentList";

export default function PaymentPage() {
    const [open, setOpen] = useState<boolean>(false);
    const [reload, setReload] = useState<boolean>(false);

    const handleAdded = () => setReload((prev) => !prev);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Phương thức thanh toán</h1>

            <button
                className="mb-4 px-4 py-2 bg-black text-white rounded"
                onClick={() => setOpen(true)}
            >
                + Thêm phương thức
            </button>

            <PaymentList key={reload ? "reload1" : "reload2"} />

            <AddPaymentModal
                open={open}
                onClose={() => setOpen(false)}
                onAdded={handleAdded}
            />
        </div>
    );
}
