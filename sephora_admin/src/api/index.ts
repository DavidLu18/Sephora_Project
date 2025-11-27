export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

const buildHeaders = (headers: HeadersInit = {}) => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchJSON = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(API_URL + url, {
    ...options,
    headers: buildHeaders(options.headers || {}),
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const fetchFormData = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = getAuthToken();
  const res = await fetch(API_URL + url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};