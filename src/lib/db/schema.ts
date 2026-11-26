/**
 * Database schema definitions for ShareBite.
 * Maps relational models for Postgres / Prisma / Supabase integration.
 */

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "donor" | "ngo" | "volunteer" | "admin";
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbDonorProfile {
  id: string;
  userId: string;
  category: "Restaurant" | "Hotel" | "College Canteen" | "Hostel" | "Event Organizer" | "Individual";
  organizationName?: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  foodSafetyCertNo?: string;
}

export interface DbNGOProfile {
  id: string;
  userId: string;
  name: string;
  registrationNumber: string;
  verificationStatus: "verified" | "pending" | "rejected";
  capacityPerDay: number;
  contactPerson: string;
  phone: string;
  operationalHours: string;
  documentUrls: string[];
}

export interface DbDonation {
  id: string;
  donorId: string;
  title: string;
  description: string;
  foodType: string;
  quantity: number;
  unit: string;
  servingsEstimate: number;
  perishableHours: number;
  preparedAt?: Date;
  expiresAt: Date;
  status: "available" | "requested" | "accepted" | "in_transit" | "completed" | "cancelled" | "expired";
  pickupStreet: string;
  pickupCity: string;
  pickupZip: string;
  createdAt: Date;
}

export interface DbPickupAssignment {
  id: string;
  donationId: string;
  ngoId: string;
  volunteerId?: string;
  status: "unassigned" | "assigned" | "on_the_way" | "picked_up" | "delivered" | "failed";
  pickupTimeWindow: string;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  notes?: string;
}

export interface DbImpactLog {
  id: string;
  donationId: string;
  mealsCount: number;
  weightKg: number;
  co2SavedKg: number;
  loggedAt: Date;
}
