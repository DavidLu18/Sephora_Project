export const formatVND = (value: number | string | null | undefined) => {
  if (!value) return "0₫";
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("vi-VN").format(num) + "₫";
};
