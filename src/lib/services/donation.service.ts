import { DonationItem, DonationStatus } from "@/types/donation";

/**
 * Service Layer: Donation Management
 * In browser: queries REST API (/api/donations)
 * On server: queries SQLite database repository
 */
class DonationService {
  async getDonations(filter?: {
    donorId?: string;
    status?: string;
    category?: string;
  }): Promise<DonationItem[]> {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (filter?.donorId) params.append("donorId", filter.donorId);
      if (filter?.status) params.append("status", filter.status);
      if (filter?.category) params.append("category", filter.category);
      try {
        const res = await fetch(`/api/donations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.donations;
        }
      } catch {
        return [];
      }
      return [];
    }

    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.getDonations({
      donorUserId: filter?.donorId,
      status: filter?.status,
      category: filter?.category,
    });
  }

  async getDonationById(id: string): Promise<DonationItem | null> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/donations/${id}`);
        if (res.ok) {
          const data = await res.json();
          return data.donation;
        }
      } catch {
        return null;
      }
      return null;
    }

    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.getDonationById(id);
  }

  async createDonation(data: {
    donorId: string;
    donorName?: string;
    title: string;
    description?: string;
    foodType: string;
    quantity: number;
    unit?: string;
    servingsEstimate: number;
    preparationTime?: string;
    availableUntil: string;
    storageMethod?: string;
    dietaryInfo?: string[];
    imageUrl?: string;
    pickupAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    locationName?: string;
    latitude?: number;
    longitude?: number;
    specialInstructions?: string;
    safetyConfirmed?: boolean;
    status?: DonationStatus;
  }): Promise<DonationItem> {
    const formattedAddress = `${data.pickupAddress.street}, ${data.pickupAddress.city}, ${data.pickupAddress.state} ${data.pickupAddress.zipCode}`.trim();

    if (typeof window !== "undefined") {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorUserId: data.donorId,
          foodName: data.title,
          description: data.description || "",
          category: data.foodType,
          quantity: data.quantity,
          unit: data.unit || "servings",
          servings: data.servingsEstimate,
          preparationTime: data.preparationTime,
          availableUntil: data.availableUntil,
          storageMethod: data.storageMethod,
          allergens: data.dietaryInfo,
          imageUrl: data.imageUrl,
          pickupAddress: formattedAddress,
          latitude: data.latitude,
          longitude: data.longitude,
          specialInstructions: data.specialInstructions,
          safetyConfirmed: data.safetyConfirmed,
          status: data.status,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to create donation");
      }
      return resData.donation;
    }

    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.createDonation({
      donorUserId: data.donorId,
      foodName: data.title,
      description: data.description || "",
      category: data.foodType as any,
      quantity: data.quantity,
      unit: data.unit,
      servings: data.servingsEstimate,
      preparationTime: data.preparationTime,
      availableUntil: data.availableUntil,
      storageMethod: data.storageMethod,
      allergens: data.dietaryInfo,
      imageUrl: data.imageUrl,
      pickupAddress: formattedAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      specialInstructions: data.specialInstructions,
      status: data.status,
      safetyConfirmed: data.safetyConfirmed,
    });
  }

  async updateStatus(id: string, status: DonationStatus): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    }

    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.updateDonationStatus(id, status);
  }

  async advanceLifecycle(id: string, actionOrStatus: string): Promise<DonationItem | null> {
    if (typeof window !== "undefined") {
      const isAction = ["advance", "cancel"].includes(actionOrStatus);
      const res = await fetch(`/api/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isAction ? { action: actionOrStatus } : { status: actionOrStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.donation;
      }
      const err = await res.json();
      throw new Error(err.error || "Failed to update lifecycle");
    }

    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.advanceLifecycle(id, actionOrStatus as DonationStatus);
  }

  async getDonorStats(donorUserId: string) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/donations?stats=true&donorId=${donorUserId}`);
        if (res.ok) {
          const data = await res.json();
          return data.stats;
        }
      } catch {
        // Fall back below
      }
    }

    const { DonationRepository } = require("@/lib/db/repositories/donation.repo");
    return DonationRepository.getDonorStats(donorUserId);
  }
}

export const donationService = new DonationService();
