"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountHomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account/info_account");
  }, [router]);
  return null;
}
