"use client";

import { useEffect } from "react";
import { setupFirebaseTokenRefresh } from "@/lib/firebase-auth-refresh";

export default function AuthTokenRefresh() {
  useEffect(() => {
    setupFirebaseTokenRefresh();
  }, []);

  return null; // Không render gì
}
