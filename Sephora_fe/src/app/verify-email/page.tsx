"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      await user.reload();

      if (user.emailVerified) {
        const token = await user.getIdToken(true);

        // 👉 LƯU USER VÀO DJANGO
        await fetch("http://127.0.0.1:8000/api/users/register_user/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        });

        alert("Xác minh email thành công!");
        router.replace("/"); // hoặc /signin
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
    <p>Email của bạn đã được xác minh.</p>
      <p>Vui lòng quay lại trang và đăng nhập để tiếp tục.</p>
    </div>
  );
}
