import { PickupTask, PickupStatus } from "@/types/pickup";
import { VolunteerStats, VolunteerProfile } from "@/lib/db/repositories/volunteer.repo";

/**
 * Service Layer: Volunteer Logistics & Pickups
 * In browser: queries REST API (/api/pickups, /api/volunteer/*)
 * On server: queries SQLite database repository directly
 */
class VolunteerService {
  async getAvailablePickups(filter?: {
    category?: string;
    maxDistance?: number;
    urgency?: string;
  }): Promise<PickupTask[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        if (filter?.category && filter.category !== "All") params.append("category", filter.category);
        if (filter?.urgency && filter.urgency !== "All") params.append("urgency", filter.urgency);
        if (filter?.maxDistance) params.append("maxDistance", filter.maxDistance.toString());

        const res = await fetch(`/api/pickups?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.pickups || [];
        }
      } catch {
        return [];
      }
      return [];
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.getAvailablePickups(filter);
  }

  async getMyPickups(volunteerUserId: string, statusFilter?: string): Promise<PickupTask[]> {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams();
        params.append("volunteerId", volunteerUserId);
        if (statusFilter && statusFilter !== "All") params.append("status", statusFilter);

        const res = await fetch(`/api/pickups?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.pickups || [];
        }
      } catch {
        return [];
      }
      return [];
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.getMyPickups(volunteerUserId, statusFilter);
  }

  async getPickupById(id: string): Promise<PickupTask | null> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/pickups/${id}`);
        if (res.ok) {
          const data = await res.json();
          return data.pickup || null;
        }
      } catch {
        return null;
      }
      return null;
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.getPickupById(id);
  }

  async claimPickup(
    pickupId: string,
    volunteerUserId: string
  ): Promise<{ success: boolean; pickup?: PickupTask; message: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupId,
          volunteerUserId,
          action: "claim",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept pickup.");
      }
      return data;
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.claimPickup(pickupId, volunteerUserId);
  }

  async updatePickupStatus(
    pickupId: string,
    status: PickupStatus,
    volunteerUserId?: string,
    verificationData?: {
      verificationNotes?: string;
      tempC?: number;
      photoUrl?: string;
      recipientName?: string;
      digitalSignature?: string;
    }
  ): Promise<{ success: boolean; pickup?: PickupTask; message: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupId,
          status,
          volunteerUserId,
          ...verificationData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update pickup status.");
      }
      return data;
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.updatePickupLifecycle({
      pickupId,
      volunteerUserId: volunteerUserId || "usr_vol_1",
      status,
      ...verificationData,
    });
  }

  async getVolunteerStats(volunteerUserId: string): Promise<VolunteerStats> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/volunteer/stats?volunteerId=${encodeURIComponent(volunteerUserId)}`);
        if (res.ok) {
          const data = await res.json();
          return data.stats;
        }
      } catch {
        // fallback to server repo if called in hybrid context
      }
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.getVolunteerStats(volunteerUserId);
  }

  async setAvailability(
    volunteerUserId: string,
    availabilityStatus: "available" | "unavailable"
  ): Promise<{ success: boolean; availabilityStatus: string; message: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/volunteer/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerUserId, availabilityStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update availability");
      return data;
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    const updated = VolunteerRepository.setAvailability(volunteerUserId, availabilityStatus);
    return {
      success: true,
      availabilityStatus: updated.availabilityStatus,
      message: `Status updated to ${updated.availabilityStatus}`,
    };
  }

  async getProfile(volunteerUserId: string): Promise<VolunteerProfile> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/volunteer/profile?volunteerId=${encodeURIComponent(volunteerUserId)}`);
        if (res.ok) {
          const data = await res.json();
          return data.profile;
        }
      } catch {
        // fallback
      }
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    return VolunteerRepository.getVolunteerProfileByUserId(volunteerUserId);
  }

  async updateProfile(
    volunteerUserId: string,
    data: {
      address?: string;
      latitude?: number;
      longitude?: number;
      vehicleType?: string;
      preferredRadius?: number;
    }
  ): Promise<{ success: boolean; profile?: VolunteerProfile; message: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/volunteer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerUserId, ...data }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update profile");
      return resData;
    }

    const { VolunteerRepository } = require("@/lib/db/repositories/volunteer.repo");
    const updated = VolunteerRepository.updateVolunteerProfile(volunteerUserId, data);
    return { success: true, profile: updated, message: "Profile updated" };
  }
}

export const volunteerService = new VolunteerService();
