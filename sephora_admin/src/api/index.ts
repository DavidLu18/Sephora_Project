export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const fetchJSON = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};



export const fetchFormData = async (
  url: string,
  options: RequestInit = {}
) => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      // Không set Content-Type, để browser tự set multipart boundary
    },
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};