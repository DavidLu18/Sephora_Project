// src/components/AutoImage.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

interface AutoImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const BACKEND_URL = "http://127.0.0.1:8000"; // hoặc cho vào env: process.env.NEXT_PUBLIC_BACKEND_URL

export default function AutoImage({
  src,
  alt,
  width,
  height,
  className,
}: AutoImageProps) {
  // nếu BE trả về đường dẫn tương đối kiểu "/media/..." thì mình prefix
  const normalizeSrc = (url: string) => {
    if (!url) return `${BACKEND_URL}/media/products/default.jpg`;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url}`;
  };

  const [imgSrc, setImgSrc] = useState<string>(normalizeSrc(src));

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImgSrc(`${BACKEND_URL}/media/products/default.jpg`)}
      unoptimized
    />
  );
}
