import { AdminOverviewStats, AdminUserRecord } from "@/lib/db/repositories/admin.repo";
import { ReportCategory } from "@/types/report";

class AdminService {
  async getOverviewStats(): Promise<AdminOverviewStats> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/admin/overview");
        if (res.ok) {
          const data = await res.json();
          return data.stats;
        }
      } catch {
        // fallback
      }
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getOverviewStats();
  }

  async getAllUsers(filter?: { search?: string; role?: string; status?: string }): Promise<AdminUserRecord[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (filter?.search) params.append("search", filter.search);
        if (filter?.role && filter.role !== "all") params.append("role", filter.role);
        if (filter?.status && filter.status !== "all") params.append("status", filter.status);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.users || [];
        }
      } catch {
        return [];
      }
      return [];
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getAllUsers(filter);
  }

  async getUserDetails(userId: string): Promise<any> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          return data.details || null;
        }
      } catch {
        return null;
      }
      return null;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getUserDetails(userId);
  }

  async setUserStatus(userId: string, status: "active" | "suspended"): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user status.");
      }
      return true;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.setUserStatus(userId, status);
  }

  async getNGOApplications(statusFilter?: string): Promise<any[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

        const res = await fetch(`/api/admin/ngos?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.ngos || [];
        }
      } catch {
        return [];
      }
      return [];
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getNgoApplications(statusFilter);
  }

  async updateNgoStatus(
    ngoId: string,
    status: "verified" | "rejected" | "suspended" | "pending",
    notes?: string
  ): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/ngos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId, status, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update NGO verification.");
      }
      return true;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.updateNgoStatus(ngoId, status, notes);
  }

  async getAllDonations(filter?: { status?: string; search?: string }): Promise<any[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (filter?.status && filter.status !== "all") params.append("status", filter.status);
        if (filter?.search) params.append("search", filter.search);

        const res = await fetch(`/api/admin/donations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.donations || [];
        }
      } catch {
        return [];
      }
      return [];
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getAllDonations(filter);
  }

  async cancelDonation(donationId: string, reason: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel donation.");
      }
      return true;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.cancelDonation(donationId, reason);
  }

  async getVolunteers(filter?: { search?: string; status?: string; verificationStatus?: string }): Promise<any[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (filter?.search) params.append("search", filter.search);
        if (filter?.status && filter.status !== "all") params.append("status", filter.status);
        if (filter?.verificationStatus && filter.verificationStatus !== "all") {
          params.append("verificationStatus", filter.verificationStatus);
        }

        const res = await fetch(`/api/admin/volunteers?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.volunteers || [];
        }
      } catch {
        return [];
      }
      return [];
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getVolunteers(filter);
  }

  async updateVolunteerVerification(userId: string, verificationStatus: "verified" | "rejected"): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verificationStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update volunteer verification.");
      }
      return true;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.updateVolunteerVerification(userId, verificationStatus);
  }

  async updateVolunteerStatus(userId: string, status: "active" | "suspended"): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update volunteer status.");
      }
      return true;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.updateVolunteerStatus(userId, status);
  }

  async getReports(filter?: { category?: string; status?: string; severity?: string }): Promise<any[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (filter?.category && filter.category !== "all") params.append("category", filter.category);
        if (filter?.status && filter.status !== "all") params.append("status", filter.status);
        if (filter?.severity && filter.severity !== "all") params.append("severity", filter.severity);

        const res = await fetch(`/api/admin/reports?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.reports || [];
        }
      } catch {
        return [];
      }
      return [];
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getReports(filter);
  }

  async updateReportStatus(
    reportId: string,
    status: "open" | "investigating" | "resolved" | "dismissed",
    adminNotes?: string
  ): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status, adminNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update report status.");
      }
      return true;
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.updateReportStatus(reportId, status, adminNotes);
  }

  async createReport(data: {
    reporterId: string;
    reportedEntityType: "donation" | "ngo" | "donor" | "volunteer" | "other";
    reportedEntityId?: string;
    reportedTitle: string;
    category: ReportCategory;
    description: string;
    severity?: "low" | "medium" | "high" | "critical";
  }): Promise<any> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit report.");
      }
      return res.json();
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.createReport(data);
  }

  async getAnalytics(): Promise<any> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          return data.analytics;
        }
      } catch {
        // fallback
      }
    }
    const { AdminRepository } = require("@/lib/db/repositories/admin.repo");
    return AdminRepository.getAnalytics();
  }
}

export const adminService = new AdminService();
