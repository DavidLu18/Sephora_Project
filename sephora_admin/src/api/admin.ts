import { API_URL } from "./index";
import { DashboardStats } from "@/types/dashboard";

export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  const res = await fetch(`${API_URL}/admin/dashboard-stats/`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard stats");

  return res.json() as Promise<DashboardStats>;
};

