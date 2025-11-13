export const USD_TO_VND = 25000; // có thể điều chỉnh theo tỷ giá thực tế

export const convertToVND = (usdValue: number | string | undefined) => {
  if (!usdValue) return "N/A";
  const value = Number(usdValue) * USD_TO_VND;
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};
