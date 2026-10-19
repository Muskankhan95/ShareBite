import { getImpactStatistics } from "@/lib/impact.functions";

export const adminService = {
  platformStats: () => getImpactStatistics(),
};
