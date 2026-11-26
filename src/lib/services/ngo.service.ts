import { NGOProfile, FoodRequest, NGOVerificationStatus } from "@/types/ngo";
import { DonationItem } from "@/types/donation";

/**
 * Service Layer: NGO Operations & Food Matching
 * In browser: queries REST APIs (/api/ngo/*, /api/requests)
 * On server: queries SQLite database repository
 */
class NGOService {
  async getNgoProfile(userId?: string): Promise<NGOProfile | null> {
    if (typeof window !== "undefined") {
      try {
        const url = userId ? `/api/ngo/profile?userId=${encodeURIComponent(userId)}` : "/api/ngo/profile";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data.profile;
        }
      } catch {
        return null;
      }
      return null;
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.getNgoProfileByUserId(userId || "usr_ngo_1");
  }

  async updateNgoProfile(
    userId: string,
    data: {
      capacity?: number;
      currentRequirement?: number;
      preferredCategories?: string[];
      operationalHours?: string;
      contactPerson?: string;
      phone?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      organizationName?: string;
      verificationStatus?: NGOVerificationStatus;
    }
  ): Promise<NGOProfile> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/ngo/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update NGO profile");
      }
      return resData.profile;
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    const updated = NGORepository.updateNgoCapacityAndPreferences(userId, data);
    if (!updated) throw new Error("NGO Profile not found");
    return updated;
  }

  async getNearbyAvailableDonations(filter?: {
    category?: string;
    maxDistance?: number;
    minQuantity?: number;
    maxHoursRemaining?: number;
    radiusKm?: number;
    lat?: number;
    lng?: number;
    ngoUserId?: string;
  }): Promise<Array<DonationItem & { distanceMiles: number; distanceKm?: number; estimatedMinutes?: number; urgencyLevel: "urgent" | "standard" }>> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (filter?.category && filter.category !== "all") params.append("category", filter.category);
        if (filter?.maxDistance) params.append("maxDistance", String(filter.maxDistance));
        if (filter?.minQuantity) params.append("minQuantity", String(filter.minQuantity));
        if (filter?.maxHoursRemaining) params.append("maxHoursRemaining", String(filter.maxHoursRemaining));
        if (filter?.radiusKm) params.append("radiusKm", String(filter.radiusKm));
        if (filter?.lat) params.append("lat", String(filter.lat));
        if (filter?.lng) params.append("lng", String(filter.lng));
        if (filter?.ngoUserId) params.append("ngoUserId", filter.ngoUserId);

        const res = await fetch(`/api/ngo/nearby?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.donations;
        }
      } catch {
        return [];
      }
      return [];
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.getNearbyFood(filter);
  }

  async acceptDonation(data: {
    donationId: string;
    ngoUserId: string;
    requestedQuantity?: number;
  }): Promise<{ success: boolean; donation: DonationItem; message: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/ngo/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to accept food donation");
      }
      return resData;
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.acceptFoodDonation(data);
  }

  async getAcceptedDonations(ngoUserId: string): Promise<DonationItem[]> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/donations?status=accepted`);
        if (res.ok) {
          const data = await res.json();
          return data.donations;
        }
      } catch {
        return [];
      }
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.getAcceptedDonations(ngoUserId);
  }

  async getCompletedDonations(ngoUserId: string): Promise<DonationItem[]> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/donations?status=completed`);
        if (res.ok) {
          const data = await res.json();
          return data.donations;
        }
      } catch {
        return [];
      }
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.getCompletedDonations(ngoUserId);
  }

  async confirmDeliveryReceived(donationId: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/donations/${donationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      return res.ok;
    }
    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.updateDonationStatus(donationId, "completed");
  }

  async getFoodRequests(ngoUserId?: string): Promise<FoodRequest[]> {
    if (typeof window !== "undefined") {
      try {
        const url = ngoUserId ? `/api/requests?ngoId=${encodeURIComponent(ngoUserId)}` : "/api/requests";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data.requests;
        }
      } catch {
        return [];
      }
      return [];
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.getFoodRequests(ngoUserId);
  }

  async createFoodRequest(
    data: Omit<FoodRequest, "id" | "createdAt" | "status">
  ): Promise<FoodRequest> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngoUserId: data.ngoId,
          foodTypeNeeded: data.foodTypeNeeded,
          servingsRequired: data.servingsRequired,
          urgency: data.urgency,
          neededBy: data.neededBy,
          location: data.location,
          notes: data.notes,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to create food request");
      }
      return resData.request;
    }

    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.createFoodRequest({
      ngoUserId: data.ngoId,
      foodTypeNeeded: data.foodTypeNeeded,
      servingsRequired: data.servingsRequired,
      urgency: data.urgency,
      neededBy: data.neededBy,
      location: data.location,
      notes: data.notes,
    });
  }

  async getNGOStats(ngoUserId: string) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/ngo/stats?userId=${encodeURIComponent(ngoUserId)}`);
        if (res.ok) {
          const data = await res.json();
          return data.stats;
        }
      } catch {
        // fallback
      }
    }
    const { NGORepository } = require("@/lib/db/repositories/ngo.repo");
    return NGORepository.getNGOStats(ngoUserId);
  }
}

export const ngoService = new NGOService();
