"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { fetchJSON } from "@/api";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        setAuthorized(false);
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_email", user.email ?? "");
        const profile = await fetchJSON(`/api/users/get_user/?email=${user.email}`);
        if (profile.role !== "admin") {
          await signOut(auth);
          localStorage.removeItem("admin_token");
          alert("Tài khoản của bạn không có quyền truy cập trang quản trị.");
          router.push("/login");
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error("AuthGate error:", error);
        alert("Không thể xác thực người dùng admin.");
        setAuthorized(false);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}


