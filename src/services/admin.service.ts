import { notImplemented } from "./api-client";
import type { ImpactStats, NgoProfile, UserProfile } from "@/types";

export const adminService = {
  listUsers: () => notImplemented<UserProfile[]>("User management"),
  listNgos: () => notImplemented<NgoProfile[]>("NGO verification queue"),
  platformStats: () => notImplemented<ImpactStats>("Platform statistics"),
};
