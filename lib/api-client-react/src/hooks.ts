import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

export function useAdminLogs(page = 1, limit = 20, search = "") {
  return useQuery({
    queryKey: ["admin-logs", page, limit, search],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/logs", {
        params: { page, limit, search },
      });
      return data as {
        logs: Array<{
          id: number;
          ipAddress: string;
          deviceInfo: string;
          actionType: string;
          createdAt: string;
        }>;
        total: number;
      };
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/stats");
      return data as {
        totalVisits: number;
        uniqueIps: number;
        todayVisits: number;
        dataProcessed: number;
      };
    },
  });
}
