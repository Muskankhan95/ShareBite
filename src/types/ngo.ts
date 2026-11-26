export type NGOVerificationStatus = "verified" | "pending" | "rejected" | "suspended";

export interface NGOProfile {
  id: string;
  userId?: string;
  name: string;
  organizationName?: string;
  registrationNumber: string;
  verificationStatus: NGOVerificationStatus;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  capacityPerDay: number;
  currentRequirement?: number;
  currentBeneficiaries?: number;
  operationalHours: string;
  foodPreferences: string[];
  documentsSubmitted?: string[];
  verifiedAt?: string;
  description?: string;
}

export interface FoodRequest {
  id: string;
  ngoId: string;
  ngoName: string;
  foodTypeNeeded: string;
  servingsRequired: number;
  urgency: "urgent" | "standard";
  neededBy: string;
  location: string;
  status: "open" | "fulfilled" | "cancelled";
  createdAt: string;
  notes?: string;
}
