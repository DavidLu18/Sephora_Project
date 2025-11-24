import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import HeaderWrapper from "@/components/HeaderWrapper";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sephora",
  description: "Khóa luận tốt nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-visible`}
      >
        {/* Header luôn ở trên cùng */}
        <div className="relative z-[2000]">
          <HeaderWrapper />
        </div>

        {/* Navbar nằm dưới header */}
        <div className="relative z-[1500]">
          <Navbar />
        </div>

        {/* Nội dung trang */}
        <main className="relative z-[100]">{children}</main>

        {/* Footer */}
        <footer className="relative z-[50]">
          <Footer />
        </footer>
      </body>
    </html>
  );
}


