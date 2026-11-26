import { UrgencyLevel } from "./types";
import { calculateHaversineDistance } from "@/lib/utils/geo";

export interface UrgencyThresholdsConfig {
  lowMax: number;     // default 25
  mediumMax: number;  // default 50
  highMax: number;    // default 75
}

export const DEFAULT_URGENCY_SCORE_THRESHOLDS: UrgencyThresholdsConfig = {
  lowMax: 25,
  mediumMax: 50,
  highMax: 75,
};

export interface UrgencyPredictionInput {
  availableUntil: string | Date | undefined | null;
  preparationTime?: string | Date | undefined | null;
  foodCategory?: string;
  storageMethod?: string;
  quantity?: number;
  servings?: number;
  pickupLat?: number;
  pickupLng?: number;
  suitableNgos?: Array<{
    latitude?: number;
    longitude?: number;
    capacity?: number;
    verificationStatus?: string;
  }>;
  referenceDate?: Date;
  thresholds?: UrgencyThresholdsConfig;
}

export interface UrgencyPredictionResult {
  score: number; // 0–100
  level: UrgencyLevel;
  minutesRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
  breakdown: {
    timeRemainingScore: number;
    preparationElapsedScore: number;
    categoryPerishabilityScore: number;
    storageMethodScore: number;
    batchSizeScore: number;
    ngoProximityScore: number;
  };
  reasons: string[];
  warnings: string[];
  safetyDisclaimer: string;
}

export const SAFETY_DISCLAIMER =
  "DECISION-SUPPORT NOTICE: This urgency score is an operational scheduling aid designed to streamline logistics and reduce food waste. It does NOT evaluate, certify, or guarantee the microbiological safety, wholesomeness, or edibility of the food. Food safety verification remains the mutual responsibility of the donor and receiving organization.";

/**
 * Advanced multi-factor, rule-based urgency prediction module.
 *
 * Factors evaluated:
 * 1. Time remaining until available_until (up to 60 pts)
 * 2. Preparation elapsed time (up to 10 pts)
 * 3. Food Category perishability (up to 12 pts)
 * 4. Storage Method / holding stability (up to 8 pts)
 * 5. Batch Size / portion quantity (up to 5 pts)
 * 6. Geographic proximity & NGO availability (up to 5 pts)
 *
 * Resulting score: 0–100, mapped into LOW, MEDIUM, HIGH, CRITICAL.
 */
export function predictDonationUrgency(
  input: UrgencyPredictionInput
): UrgencyPredictionResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const now = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const thresholds = input.thresholds || DEFAULT_URGENCY_SCORE_THRESHOLDS;

  let timeRemainingScore = 20;
  let minutesRemaining = 180;
  let isExpired = false;

  // 1. Time Remaining Analysis
  if (!input.availableUntil) {
    warnings.push("Availability time is missing. Defaulted to standard medium priority.");
    timeRemainingScore = 30;
  } else {
    const targetDate = new Date(input.availableUntil);
    if (isNaN(targetDate.getTime())) {
      warnings.push("Invalid availability time provided. Defaulted to standard priority.");
      timeRemainingScore = 30;
    } else {
      const diffMs = targetDate.getTime() - now.getTime();
      minutesRemaining = Math.round(diffMs / (60 * 1000));

      if (minutesRemaining <= 0) {
        isExpired = true;
        timeRemainingScore = 60;
        minutesRemaining = 0;
        warnings.push("Donation has exceeded its scheduled availability window.");
      } else if (minutesRemaining <= 60) {
        // Under 1 hour
        const pct = 1 - minutesRemaining / 60;
        timeRemainingScore = Math.round(50 + pct * 10); // 50 to 60
        reasons.push(`Critical time window: only ${minutesRemaining} minutes remaining`);
      } else if (minutesRemaining <= 120) {
        // 1 to 2 hours
        const pct = 1 - (minutesRemaining - 60) / 60;
        timeRemainingScore = Math.round(35 + pct * 15); // 35 to 50
        reasons.push(`Time-sensitive: ${minutesRemaining} minutes remaining until expiration`);
      } else if (minutesRemaining <= 240) {
        // 2 to 4 hours
        const pct = 1 - (minutesRemaining - 120) / 120;
        timeRemainingScore = Math.round(20 + pct * 15); // 20 to 35
        reasons.push(`Moderate shelf-life: ~${Math.round(minutesRemaining / 60)} hours remaining`);
      } else {
        // Over 4 hours
        timeRemainingScore = Math.max(5, Math.round(20 - Math.min(15, (minutesRemaining - 240) / 60)));
        reasons.push(`Stable window: over ${(minutesRemaining / 60).toFixed(1)} hours remaining`);
      }
    }
  }

  // 2. Preparation Elapsed Time (up to 10 pts)
  let preparationElapsedScore = 4;
  if (input.preparationTime) {
    const prepDate = new Date(input.preparationTime);
    if (!isNaN(prepDate.getTime())) {
      const elapsedMins = Math.round((now.getTime() - prepDate.getTime()) / (60 * 1000));
      if (elapsedMins > 240) {
        preparationElapsedScore = 10;
        reasons.push(`Prepared over 4 hours ago (${Math.round(elapsedMins / 60)}h elapsed)`);
      } else if (elapsedMins > 120) {
        preparationElapsedScore = 7;
        reasons.push(`Prepared ~${Math.round(elapsedMins / 60)} hours ago`);
      } else if (elapsedMins > 0) {
        preparationElapsedScore = 3;
        reasons.push("Freshly prepared within past 2 hours");
      }
    }
  }

  // 3. Food Category Perishability (up to 12 pts)
  let categoryPerishabilityScore = 6;
  const category = (input.foodCategory || "").toLowerCase().trim();
  if (
    category.includes("cooked") ||
    category.includes("rice") ||
    category.includes("meal") ||
    category.includes("dairy") ||
    category.includes("meat") ||
    category.includes("seafood")
  ) {
    categoryPerishabilityScore = 12;
    reasons.push(`Highly perishable category ('${input.foodCategory || "Cooked meals"}')`);
  } else if (
    category.includes("bakery") ||
    category.includes("bread") ||
    category.includes("fruit") ||
    category.includes("vegetable") ||
    category.includes("produce")
  ) {
    categoryPerishabilityScore = 7;
    reasons.push(`Moderate perishability category ('${input.foodCategory || "Bakery/Produce"}')`);
  } else if (
    category.includes("packaged") ||
    category.includes("canned") ||
    category.includes("grocery") ||
    category.includes("dry")
  ) {
    categoryPerishabilityScore = 2;
    reasons.push("Shelf-stable packaged goods with lower perishability");
  }

  // 4. Storage Method (up to 8 pts)
  let storageMethodScore = 4;
  const storage = (input.storageMethod || "").toLowerCase().trim();
  if (storage.includes("hot") || storage.includes("warm")) {
    storageMethodScore = 8;
    reasons.push("Hot holding storage requires rapid distribution to maintain quality");
  } else if (storage.includes("room") || storage.includes("ambient")) {
    storageMethodScore = 6;
    reasons.push("Ambient room temperature storage limits holding duration");
  } else if (storage.includes("refrigerat") || storage.includes("cold")) {
    storageMethodScore = 3;
    reasons.push("Refrigerated storage provides temporary temperature preservation");
  } else if (storage.includes("frozen")) {
    storageMethodScore = 1;
    reasons.push("Frozen storage significantly stabilizes shelf-life");
  }

  // 5. Batch Size / Servings Quantity (up to 5 pts)
  let batchSizeScore = 2;
  const servings = input.servings || input.quantity || 30;
  if (servings >= 80) {
    batchSizeScore = 5;
    reasons.push(`Large rescue volume (${servings} portions) requires prompt logistics coordination`);
  } else if (servings >= 40) {
    batchSizeScore = 3;
    reasons.push(`Substantial portion count (${servings} meals)`);
  } else {
    batchSizeScore = 1;
  }

  // 6. Proximity & Availability of Suitable NGOs (up to 5 pts)
  let ngoProximityScore = 2;
  if (input.pickupLat === undefined || input.pickupLng === undefined) {
    warnings.push("Pickup location coordinates missing; geographic proximity omitted from urgency.");
    ngoProximityScore = 3;
  } else if (input.suitableNgos && input.suitableNgos.length > 0) {
    // Find closest verified NGO
    let minDistance = Infinity;
    for (const ngo of input.suitableNgos) {
      if (ngo.verificationStatus === "verified" && ngo.latitude && ngo.longitude) {
        const d = calculateHaversineDistance(input.pickupLat, input.pickupLng, ngo.latitude, ngo.longitude, "km");
        if (d < minDistance) minDistance = d;
      }
    }

    if (minDistance > 10 && minDistance !== Infinity) {
      ngoProximityScore = 5;
      reasons.push(`Nearest recipient shelter is ${minDistance.toFixed(1)} km away; earlier dispatch needed`);
    } else if (minDistance <= 2.5) {
      ngoProximityScore = 1;
      reasons.push(`Recipients located within close neighborhood range (${minDistance.toFixed(1)} km)`);
    } else {
      ngoProximityScore = 3;
    }
  }

  // Calculate Raw Score (0–100)
  let rawScore =
    timeRemainingScore +
    preparationElapsedScore +
    categoryPerishabilityScore +
    storageMethodScore +
    batchSizeScore +
    ngoProximityScore;

  // Boundary condition guarantees
  if (isExpired) {
    rawScore = 100;
  } else if (minutesRemaining <= 45 && rawScore < 76) {
    // Donations under 45 minutes guaranteed to reach CRITICAL threshold
    rawScore = 76 + Math.round((1 - minutesRemaining / 45) * 24);
  }

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Map to Level according to configurable thresholds
  let level: UrgencyLevel = "low";
  if (score > thresholds.highMax) {
    level = "critical";
  } else if (score > thresholds.mediumMax) {
    level = "high";
  } else if (score > thresholds.lowMax) {
    level = "medium";
  } else {
    level = "low";
  }

  return {
    score,
    level,
    minutesRemaining,
    hoursRemaining: Math.round((minutesRemaining / 60) * 10) / 10,
    isExpired,
    breakdown: {
      timeRemainingScore,
      preparationElapsedScore,
      categoryPerishabilityScore,
      storageMethodScore,
      batchSizeScore,
      ngoProximityScore,
    },
    reasons,
    warnings,
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
}
