/**
 * Domain models / types for ShareBite.
 * These describe the shape of data the app will use once the backend exists.
 */

export type UserRole = "donor" | "ngo" | "volunteer" | "admin";

export type DonorType = "restaurant" | "hotel" | "canteen" | "hostel" | "event" | "individual";

export type DonationStatus =
  | "draft"
  | "available"
  | "requested"
  | "accepted"
  | "in_transit"
  | "delivered"
  | "expired"
  | "cancelled";

export type PickupStatus = "open" | "assigned" | "picked_up" | "delivered" | "cancelled";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  city?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DonorProfile extends UserProfile {
  role: "donor";
  donorType: DonorType;
  organizationName?: string;
}

export interface NgoProfile extends UserProfile {
  role: "ngo";
  organizationName: string;
  registrationNumber?: string;
  verification: VerificationStatus;
  servingCapacity?: number;
}

export interface VolunteerProfile extends UserProfile {
  role: "volunteer";
  vehicleType?: "bike" | "scooter" | "car" | "van" | "none";
  availability?: string;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: "portions" | "kg" | "packets" | "trays";
  vegetarian: boolean;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  description?: string;
  items: FoodItem[];
  servings: number;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  status: DonationStatus;
  createdAt: string;
}

export interface FoodRequest {
  id: string;
  donationId: string;
  ngoId: string;
  ngoName: string;
  message?: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
}

export interface Pickup {
  id: string;
  donationId: string;
  volunteerId?: string;
  status: PickupStatus;
  pickupAddress: string;
  dropAddress: string;
  distanceKm?: number;
  scheduledFor?: string;
}

export interface ImpactStats {
  mealsRescued: number;
  foodSavedKg: number;
  activeDonors: number;
  successfulDeliveries: number;
}
