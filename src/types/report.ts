export type ReportCategory =
  | "incorrect_donation"
  | "food_safety_concern"
  | "fake_organization"
  | "volunteer_issue"
  | "other";

export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";
export type ReportSeverity = "low" | "medium" | "high" | "critical";

export interface FlaggedReport {
  id: string;
  reporterId?: string;
  reportedBy?: string;
  reportedRole?: string;
  reportedEntityType?: "donation" | "ngo" | "donor" | "volunteer" | "other";
  reportedEntityId?: string;
  reportedUserOrEntity?: string;
  reportedTitle: string;
  category: ReportCategory;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface PlatformAnalytics {
  totalUsers?: number;
  activeDonors: number;
  verifiedNgos?: number;
  activeVolunteers: number;
  activeDonations?: number;
  completedDonations?: number;
  mealsRescued: number;
  foodSavedKg: number;
  expiredDonations?: number;
  successfulDeliveries: number;
  activeNGOs: number;
  co2PreventedKg: number;
  waterSavedLiters: number;
}
