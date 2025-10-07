"use client";

import dynamic from "next/dynamic";

// Import Header với ssr: false bên trong Client Component
const Header = dynamic(() => import("@/components/Header"), { ssr: false });

export default function HeaderWrapper() {
  return <Header />;
}
