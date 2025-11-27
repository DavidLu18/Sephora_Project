"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AuthGate from "@/components/AuthGate";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = useMemo(() => pathname?.startsWith("/login"), [pathname]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        {children}
      </div>
    );
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 bg-[#0c0c0c] min-h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGate>
  );
}


