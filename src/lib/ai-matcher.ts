/**
 * AI Surplus Food Optimization & Matching Engine for ShareBite.
 * Calculates dynamic perishable urgency and optimal match scores between donors and recipient NGOs.
 */

export interface UrgencyAnalysis {
  score: number; // 0 to 100
  level: "critical" | "high" | "moderate" | "normal";
  decayRate: string;
  recommendedAction: string;
}

export interface MatchAnalysis {
  matchScore: number; // 0 to 100
  isRecommended: boolean;
  matchReasons: string[];
}

/**
 * Calculates real-time urgency based on expiry window and food storage method.
 */
export function calculateFoodUrgency(availableUntilIso: string, storageMethod: string = "ambient"): UrgencyAnalysis {
  const expiryTime = new Date(availableUntilIso).getTime();
  const now = Date.now();
  const hoursRemaining = Math.max(0, (expiryTime - now) / (1000 * 60 * 60));

  // Storage sensitivity multiplier
  // hot_hold and cooked ambient food decay fastest; frozen and packaged goods have higher shelf tolerance.
  let storageMultiplier = 1.0;
  if (storageMethod === "hot_hold") storageMultiplier = 1.4;
  else if (storageMethod === "ambient") storageMultiplier = 1.1;
  else if (storageMethod === "refrigerated") storageMultiplier = 0.9;
  else if (storageMethod === "frozen") storageMultiplier = 0.6;

  let baseScore = 20;
  if (hoursRemaining <= 0) {
    baseScore = 100;
  } else if (hoursRemaining <= 2) {
    baseScore = 95;
  } else if (hoursRemaining <= 4) {
    baseScore = 85;
  } else if (hoursRemaining <= 8) {
    baseScore = 70;
  } else if (hoursRemaining <= 16) {
    baseScore = 50;
  } else if (hoursRemaining <= 24) {
    baseScore = 35;
  }

  const finalScore = Math.min(100, Math.round(baseScore * storageMultiplier));

  if (finalScore >= 85) {
    return {
      score: finalScore,
      level: "critical",
      decayRate: "Rapid decay (< 3-4 hours)",
      recommendedAction: "Prioritize immediate courier dispatch to local shelter",
    };
  } else if (finalScore >= 65) {
    return {
      score: finalScore,
      level: "high",
      decayRate: "Expiring today (< 8 hours)",
      recommendedAction: "Suitable for dinner service redistribution",
    };
  } else if (finalScore >= 40) {
    return {
      score: finalScore,
      level: "moderate",
      decayRate: "Stable (within 24 hours)",
      recommendedAction: "Standard collection window",
    };
  }

  return {
    score: finalScore,
    level: "normal",
    decayRate: "Extended shelf life (> 24 hours)",
    recommendedAction: "Flexible pickup window",
  };
}

/**
 * Calculates AI Match Score between food donation and recipient NGO.
 */
export function calculateNgoMatch(
  donationServings: number,
  ngoCapacity: number | null = null,
  isNgoVerified: boolean = false,
  urgencyScore: number = 50
): MatchAnalysis {
  let score = 50;
  const reasons: string[] = [];

  // 1. Capacity alignment
  if (ngoCapacity && ngoCapacity > 0) {
    const ratio = donationServings / ngoCapacity;
    if (ratio >= 0.5 && ratio <= 1.5) {
      score += 25;
      reasons.push(`Optimal serving match (~${donationServings} meals vs ~${ngoCapacity} NGO capacity)`);
    } else if (ratio < 0.5) {
      score += 15;
      reasons.push("Easily absorbed within NGO daily distribution capacity");
    } else {
      score += 10;
      reasons.push("Large donation requiring multi-distributor coordination");
    }
  } else {
    score += 15;
    reasons.push("Compatible food relief profile");
  }

  // 2. Verification credibility boost
  if (isNgoVerified) {
    score += 20;
    reasons.push("Verified organization with vetted food safety standards");
  }

  // 3. Urgency handling readiness
  if (urgencyScore >= 75) {
    score += 5;
    reasons.push("High-urgency route prioritized for rapid dispatch");
  }

  const finalScore = Math.min(99, Math.max(30, score));

  return {
    matchScore: finalScore,
    isRecommended: finalScore >= 80,
    matchReasons: reasons,
  };
}
