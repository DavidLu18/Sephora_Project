"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  end: string; // ISO date string
}

export default function Countdown({ end }: CountdownProps) {
  const endTime = new Date(end).getTime();

  // ❗ Dùng lazy initializer để tránh lỗi "impure function"
  const [left, setLeft] = useState(() => endTime - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(endTime - Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (left <= 0) {
    return <span className="text-red-600 font-semibold">Hết hạn</span>;
  }

  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);

  return (
    <span className="text-green-600 font-semibold">
      {hours}h {minutes}m {seconds}s
    </span>
  );
}
