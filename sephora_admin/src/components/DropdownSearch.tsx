"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  id: number;
  name: string;
}

interface DropdownSearchProps {
  label: string;
  value: number | null;
  options: Option[];
  onChange: (value: number) => void;
  placeholder?: string;
}

export default function DropdownSearch({
  label,
  value,
  options,
  onChange,
  placeholder = "Tìm kiếm..."
}: DropdownSearchProps) {
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // click outside để đóng
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // filter options
  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={boxRef}>
      <label className="label-sephora">{label}</label>

      <div
        className="select-sephora cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {value
          ? options.find((o) => o.id === value)?.name
          : `Chọn ${label}`}
      </div>

      {open && (
        <div className="
          absolute top-full left-0 w-full bg-[#222] border border-gray-600 
          rounded-lg shadow-lg mt-1 z-50
        ">
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 text-sm bg-[#333] text-white border-b border-gray-600"
          />

          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-2 text-gray-400 text-sm">Không tìm thấy</p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="p-2 hover:bg-[#444] cursor-pointer text-sm"
                >
                  {item.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
