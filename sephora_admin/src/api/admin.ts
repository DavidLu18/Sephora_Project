import { DashboardStats } from "@/types/dashboard";
import { fetchJSON } from "./index";

export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  return (await fetchJSON("/api/admin/dashboard-stats/", {
    cache: "no-store",
  })) as DashboardStats;
};

