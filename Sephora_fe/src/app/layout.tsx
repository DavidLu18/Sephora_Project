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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Header + Navbar luôn hiển thị */}
        <HeaderWrapper />
        <Navbar />

        {/* Nội dung trang */}
        <main>{children}</main>

        {/* Footer luôn hiển thị */}
        <Footer />
      </body>
    </html>
  );
}
