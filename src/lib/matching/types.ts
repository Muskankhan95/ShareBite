export interface MatchingWeights {
  distance: number;
  urgency: number;
  capacity: number;
  preference: number;
  availability: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  distance: 0.30,
  urgency: 0.25,
  capacity: 0.20,
  preference: 0.15,
  availability: 0.10,
};

export interface UrgencyThresholds {
  criticalHours: number; // < 1 hr
  highHours: number;     // 1 - 2 hrs
  mediumHours: number;   // 2 - 4 hrs
}

export const DEFAULT_URGENCY_THRESHOLDS: UrgencyThresholds = {
  criticalHours: 1,
  highHours: 2,
  mediumHours: 4,
};

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export interface NGOMatchScoreFactors {
  distanceScore: number;     // 0 - 100
  urgencyScore: number;      // 0 - 100
  capacityScore: number;     // 0 - 100
  preferenceScore: number;   // 0 - 100
  availabilityScore: number; // 0 - 100
}

export interface NGOMatchResult {
  id?: string;
  donationId: string;
  ngoId: string;
  ngoName: string;
  organizationName: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  matchScore: number; // 0 - 100
  distanceKm: number;
  distanceMiles: number;
  urgencyScore: number;
  urgencyLevel: UrgencyLevel;
  minutesRemaining: number;
  factors: NGOMatchScoreFactors;
  weights: MatchingWeights;
  reasons: string[];
  warnings: string[];
  isEligible: boolean;
  capacity: number;
  currentRequirement: number;
  preferredCategories: string[];
}

export interface VolunteerMatchResult {
  volunteerId: string;
  volunteerName: string;
  phone?: string;
  vehicleType: string;
  distanceKm: number;
  distanceMiles: number;
  estimatedTravelMinutes: number;
  matchScore: number; // 0 - 100
  availabilityStatus: string;
  verificationStatus: string;
  activePickupsCount: number;
  reasons: string[];
  warnings: string[];
  isEligible: boolean;
}
