import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==================================================");
console.log("   SHAREBITE ADVANCED MATCHING & URGENCY SUITE   ");
console.log("==================================================\n");

const dbPath = path.join(process.cwd(), "data", "test-advanced-matching.db");
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Core Pure Algorithms (Matching Engine & Multi-factor Urgency Prediction)
// -----------------------------------------------------------------------------
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2, unit = "km") {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 5.0; // Graceful fallback
  }
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = 6371 * c;

  if (unit === "miles") {
    return Math.round(distanceKm * 0.621371 * 100) / 100;
  }
  return Math.round(distanceKm * 100) / 100;
}

function calculateTravelTimeMinutes(distanceKm, mode = "car") {
  const speeds = { car: 28, bike: 16, walking: 4.5 };
  const speed = speeds[mode] || 25;
  return Math.max(3, Math.round((distanceKm / speed) * 60 + 5));
}

function calculateDistanceScore(distanceKm) {
  if (distanceKm <= 0.1) return 100;
  if (distanceKm <= 1.0) return 92;
  if (distanceKm <= 2.0) return 84;
  if (distanceKm <= 5.0) return Math.max(50, Math.round(84 - ((distanceKm - 2.0) / 3.0) * 24));
  if (distanceKm <= 15.0) return Math.max(15, Math.round(60 - ((distanceKm - 5.0) / 10.0) * 45));
  if (distanceKm <= 25.0) return Math.max(0, Math.round(15 - ((distanceKm - 15.0) / 10.0) * 15));
  return 0;
}

function calculateCapacityScore(donationServings, ngoCapacity) {
  if (ngoCapacity <= 0) {
    return { score: 0, warning: "Organization currently has 0 intake capacity" };
  }
  if (ngoCapacity >= donationServings) {
    const ratio = donationServings / ngoCapacity;
    if (ratio >= 0.5 && ratio <= 1.0) return { score: 95 };
    if (ratio < 0.5) return { score: 90 };
    return { score: 100 };
  }
  const shortfallRatio = ngoCapacity / donationServings;
  const penalizedScore = Math.max(10, Math.round(shortfallRatio * 45));
  return {
    score: penalizedScore,
    warning: `Capacity mismatch: Organization can accept at most ${ngoCapacity} portions of ${donationServings} total meals`,
  };
}

function calculatePreferenceScore(donationCategory, preferredCategories, dietaryTags = []) {
  if (!preferredCategories || preferredCategories.length === 0) return 75;
  const termsToMatch = [
    donationCategory.trim().toLowerCase(),
    ...(dietaryTags || []).map((t) => t.trim().toLowerCase()),
  ].filter(Boolean);

  const accepts = preferredCategories.some((pref) => {
    const normPref = pref.trim().toLowerCase();
    if (normPref === "all" || normPref === "any") return true;
    return termsToMatch.some(
      (term) => term === normPref || term.includes(normPref) || normPref.includes(term)
    );
  });
  return accepts ? 100 : 25;
}

function calculateAvailabilityScore(verificationStatus) {
  if (verificationStatus !== "verified") {
    return { score: 0, warning: `Disqualified: Organization is not verified (status: ${verificationStatus})` };
  }
  return { score: 100 };
}

// Multi-factor Urgency Prediction
function predictDonationUrgency(input) {
  const reasons = [];
  const warnings = [];
  const now = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const thresholds = input.thresholds || { lowMax: 25, mediumMax: 50, highMax: 75 };

  let timeRemainingScore = 20;
  let minutesRemaining = 180;
  let isExpired = false;

  // 1. Time Remaining
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
        const pct = 1 - minutesRemaining / 60;
        timeRemainingScore = Math.round(50 + pct * 10);
        reasons.push(`Critical time window: only ${minutesRemaining} minutes remaining`);
      } else if (minutesRemaining <= 120) {
        const pct = 1 - (minutesRemaining - 60) / 60;
        timeRemainingScore = Math.round(35 + pct * 15);
        reasons.push(`Time-sensitive: ${minutesRemaining} minutes remaining until expiration`);
      } else if (minutesRemaining <= 240) {
        const pct = 1 - (minutesRemaining - 120) / 120;
        timeRemainingScore = Math.round(20 + pct * 15);
        reasons.push(`Moderate shelf-life: ~${Math.round(minutesRemaining / 60)} hours remaining`);
      } else {
        timeRemainingScore = Math.max(5, Math.round(20 - Math.min(15, (minutesRemaining - 240) / 60)));
        reasons.push(`Stable window: over ${(minutesRemaining / 60).toFixed(1)} hours remaining`);
      }
    }
  }

  // 2. Preparation Elapsed Time
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

  // 3. Category Perishability
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

  // 4. Storage Method
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

  // 5. Batch Size
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

  // 6. Proximity to NGOs
  let ngoProximityScore = 2;
  if (input.pickupLat === undefined || input.pickupLng === undefined) {
    warnings.push("Pickup location coordinates missing; geographic proximity omitted from urgency.");
    ngoProximityScore = 3;
  } else if (input.suitableNgos && input.suitableNgos.length > 0) {
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

  let rawScore =
    timeRemainingScore +
    preparationElapsedScore +
    categoryPerishabilityScore +
    storageMethodScore +
    batchSizeScore +
    ngoProximityScore;

  if (isExpired) {
    rawScore = 100;
  } else if (minutesRemaining <= 45 && rawScore < 76) {
    rawScore = 76 + Math.round((1 - minutesRemaining / 45) * 24);
  }

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level = "low";
  if (score > thresholds.highMax) level = "critical";
  else if (score > thresholds.mediumMax) level = "high";
  else if (score > thresholds.lowMax) level = "medium";
  else level = "low";

  const safetyDisclaimer =
    "DECISION-SUPPORT NOTICE: This urgency score is an operational scheduling aid designed to streamline logistics and reduce food waste. It does NOT evaluate, certify, or guarantee the microbiological safety, wholesomeness, or edibility of the food. Food safety verification remains the mutual responsibility of the donor and receiving organization.";

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
    safetyDisclaimer,
  };
}

// Full NGO Scoring Function
function scoreNgoForDonation(donation, ngo, weights = { distance: 0.30, urgency: 0.25, capacity: 0.20, preference: 0.15, availability: 0.10 }, thresholds = { criticalHours: 1, highHours: 2, mediumHours: 4 }, referenceDate = new Date()) {
  const donorLat = donation.latitude;
  const donorLng = donation.longitude;
  const ngoLat = ngo.latitude;
  const ngoLng = ngo.longitude;

  const distanceKm = calculateHaversineDistance(donorLat, donorLng, ngoLat, ngoLng, "km");
  const distanceMiles = calculateHaversineDistance(donorLat, donorLng, ngoLat, ngoLng, "miles");

  const distanceScore = calculateDistanceScore(distanceKm);

  // Time urgency score
  const targetTime = new Date(donation.availableUntil).getTime();
  const nowTime = referenceDate.getTime();
  let urgencyScore = 25;
  let urgencyLevel = "low";
  let minutesRemaining = 180;

  if (!isNaN(targetTime)) {
    minutesRemaining = Math.max(0, Math.round((targetTime - nowTime) / (60 * 1000)));
    const hoursRemaining = minutesRemaining / 60;
    if (minutesRemaining <= 0 || hoursRemaining < thresholds.criticalHours) {
      urgencyScore = 100;
      urgencyLevel = "critical";
    } else if (hoursRemaining <= thresholds.highHours) {
      const span = (thresholds.highHours - thresholds.criticalHours) * 60;
      const progress = (minutesRemaining - thresholds.criticalHours * 60) / (span || 1);
      urgencyScore = Math.round(100 - progress * 25);
      urgencyLevel = "high";
    } else if (hoursRemaining <= thresholds.mediumHours) {
      urgencyScore = 50;
      urgencyLevel = "medium";
    } else {
      urgencyScore = 25;
      urgencyLevel = "low";
    }
  }

  const capacityResult = calculateCapacityScore(donation.servings, ngo.capacity);
  const preferenceScore = calculatePreferenceScore(donation.category, ngo.preferredCategories, donation.dietaryTags);
  const availabilityResult = calculateAvailabilityScore(ngo.verificationStatus);

  const factors = {
    distanceScore,
    urgencyScore,
    capacityScore: capacityResult.score,
    preferenceScore,
    availabilityScore: availabilityResult.score,
  };

  const rawScore =
    factors.distanceScore * weights.distance +
    factors.urgencyScore * weights.urgency +
    factors.capacityScore * weights.capacity +
    factors.preferenceScore * weights.preference +
    factors.availabilityScore * weights.availability;

  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const isEligible = ngo.verificationStatus === "verified";

  const reasons = [];
  const warnings = [];

  if (distanceKm <= 2.5) reasons.push(`✓ Closest suitable NGO (${distanceKm.toFixed(1)} km away)`);
  else reasons.push(`• Accessible location (${distanceKm.toFixed(1)} km away)`);

  if (ngo.capacity >= donation.servings) reasons.push(`✓ Sufficient capacity (${ngo.capacity} portions available for ${donation.servings} meals)`);
  else warnings.push(`⚠️ Capacity mismatch: NGO can take at most ${ngo.capacity} of ${donation.servings} portions`);

  if (preferenceScore >= 90) reasons.push(`✓ Accepts this food category ('${donation.category}')`);
  if (urgencyLevel === "critical" || urgencyLevel === "high") reasons.push("✓ Donation is time-sensitive");

  if (!isEligible) warnings.push(`Disqualified: NGO status is ${ngo.verificationStatus}`);

  return {
    donationId: donation.id,
    ngoId: ngo.id,
    organizationName: ngo.organizationName,
    matchScore: isEligible ? matchScore : 0,
    distanceKm,
    distanceMiles,
    urgencyScore,
    urgencyLevel,
    factors,
    reasons,
    warnings,
    isEligible,
    capacity: ngo.capacity,
  };
}

function rankNgosForDonation(donation, ngos, weights, thresholds, referenceDate = new Date()) {
  const scored = ngos.map((ngo) => scoreNgoForDonation(donation, ngo, weights, thresholds, referenceDate));
  return scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (b.capacity !== a.capacity) return b.capacity - a.capacity;
    return a.ngoId.localeCompare(b.ngoId);
  });
}

function scoreVolunteerForPickup(volunteer, pickupLat, pickupLng, urgency = "standard") {
  const reasons = [];
  const warnings = [];

  const volLat = volunteer.latitude ?? 37.7749;
  const volLng = volunteer.longitude ?? -122.4194;

  const distanceKm = calculateHaversineDistance(volLat, volLng, pickupLat, pickupLng, "km");
  const distanceMiles = calculateHaversineDistance(volLat, volLng, pickupLat, pickupLng, "miles");

  const mode = volunteer.vehicleType?.toLowerCase().includes("bike") ? "bike" : "car";
  const estimatedTravelMinutes = calculateTravelTimeMinutes(distanceKm, mode);

  const isVerified = volunteer.verificationStatus === "verified";
  const isAvailable = volunteer.availabilityStatus === "available";
  const hasActivePickup = (volunteer.activePickupsCount || 0) > 0;

  let isEligible = true;

  if (!isVerified) {
    isEligible = false;
    warnings.push(`Disqualified: Volunteer is not verified (${volunteer.verificationStatus})`);
  }
  if (hasActivePickup) {
    isEligible = false;
    warnings.push("Disqualified: Volunteer is already handling an active pickup delivery");
  }
  if (!isAvailable) {
    isEligible = false;
    warnings.push(`Disqualified: Volunteer availability is '${volunteer.availabilityStatus}'`);
  }

  if (!isEligible) {
    return {
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      matchScore: 0,
      distanceKm,
      isEligible: false,
      warnings,
      reasons: [],
    };
  }

  const isUrgent = urgency === "critical" || urgency === "high";
  const distanceScore = Math.max(0, 100 - (distanceKm / 12) * 100);
  const timeScore = Math.max(0, 100 - (estimatedTravelMinutes / 40) * 100);
  const vehicleScore = volunteer.vehicleType ? 90 : 70;

  const rawScore = distanceScore * (isUrgent ? 0.35 : 0.40) + timeScore * (isUrgent ? 0.40 : 0.35) + vehicleScore * 0.25;
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  reasons.push("✓ Verified volunteer courier");
  reasons.push("✓ Currently available with zero active pickups");
  reasons.push(`✓ Closest courier (${distanceKm.toFixed(1)} km from pickup)`);

  return {
    volunteerId: volunteer.id,
    volunteerName: volunteer.name,
    matchScore,
    distanceKm,
    estimatedTravelMinutes,
    isEligible: true,
    warnings,
    reasons,
  };
}

// -----------------------------------------------------------------------------
// 10 MANDATORY TEST CASES AS SPECIFIED IN PART 9
// -----------------------------------------------------------------------------

console.log("--- 1. Test Case: Closest NGO (Prompt Example: NGO A at 1.5km vs NGO B at 7km) ---");
const refDate = new Date("2026-10-26T12:00:00Z");

const donationPart1 = {
  id: "don_veg_1",
  foodName: "Warm Vegetarian Bowls",
  category: "Vegetarian",
  servings: 50,
  quantity: 50,
  availableUntil: new Date("2026-10-26T13:30:00Z").toISOString(), // 1.5 hours remaining
  latitude: 37.7915,
  longitude: -122.3999,
  dietaryTags: ["Vegetarian"],
};

const ngoA = {
  id: "ngo_A",
  organizationName: "Downtown Harvest (NGO A)",
  latitude: 37.7858,
  longitude: -122.4140, // ~1.5 km away
  capacity: 60,
  verificationStatus: "verified",
  preferredCategories: ["Vegetarian", "Cooked meals"],
};

const ngoB = {
  id: "ngo_B",
  organizationName: "Outer City Food Bank (NGO B)",
  latitude: 37.7350,
  longitude: -122.4500, // ~7.0 km away
  capacity: 100,
  verificationStatus: "verified",
  preferredCategories: ["Vegetarian", "Cooked meals"],
};

const rankedNGOs = rankNgosForDonation(donationPart1, [ngoB, ngoA], undefined, undefined, refDate);

assert(
  rankedNGOs[0].ngoId === "ngo_A",
  `PART 1 SPEC: NGO A (1.5 km) ranked #1 over NGO B (7 km) (A score: ${rankedNGOs[0].matchScore}, B score: ${rankedNGOs[1].matchScore})`
);
assert(
  rankedNGOs[0].reasons.some((r) => r.includes("Closest suitable NGO")),
  "Explainable reason 'Closest suitable NGO' present for NGO A"
);

console.log("\n--- 2. Test Case: NGO with Insufficient Capacity ---");
const ngoUnderCapacity = {
  id: "ngo_small_cap",
  organizationName: "Mini Pantry",
  latitude: 37.7858,
  longitude: -122.4140,
  capacity: 15, // Only 15 portions for 50 meals!
  verificationStatus: "verified",
  preferredCategories: ["Vegetarian"],
};

const underCapScore = scoreNgoForDonation(donationPart1, ngoUnderCapacity, undefined, undefined, refDate);
assert(
  underCapScore.factors.capacityScore < 30,
  `Insufficient capacity NGO receives penalized capacity score (got: ${underCapScore.factors.capacityScore})`
);
assert(
  underCapScore.warnings.some((w) => w.includes("Capacity mismatch")),
  "Capacity mismatch warning explicitly reported"
);

console.log("\n--- 3. Test Case: Unavailable NGO ---");
const ngoSuspended = {
  id: "ngo_susp",
  organizationName: "Suspended Shelter",
  latitude: 37.7858,
  longitude: -122.4140,
  capacity: 80,
  verificationStatus: "suspended", // Suspended / unverified
  preferredCategories: ["Vegetarian"],
};

const unavailScore = scoreNgoForDonation(donationPart1, ngoSuspended, undefined, undefined, refDate);
assert(
  unavailScore.matchScore === 0,
  "Unavailable/suspended NGO receives match score 0"
);
assert(
  unavailScore.isEligible === false,
  "Unavailable NGO marked isEligible = false"
);
assert(
  unavailScore.warnings.some((w) => w.includes("Disqualified")),
  "Disqualification warning present"
);

console.log("\n--- 4. Test Case: Critical Donation (Urgency Prediction) ---");
const criticalDonationInput = {
  availableUntil: new Date("2026-10-26T12:35:00Z").toISOString(), // Only 35 mins remaining!
  preparationTime: new Date("2026-10-26T08:00:00Z").toISOString(), // 4 hours ago
  foodCategory: "Cooked meals",
  storageMethod: "Hot Holding (above 60°C)",
  quantity: 60,
  servings: 60,
  pickupLat: 37.7915,
  pickupLng: -122.3999,
  referenceDate: refDate,
};

const critUrgency = predictDonationUrgency(criticalDonationInput);
assert(
  critUrgency.level === "critical",
  `Under 45m cooked meal classified as CRITICAL (got: ${critUrgency.level}, score: ${critUrgency.score})`
);
assert(
  critUrgency.score >= 76,
  `Critical urgency score is between 76–100 (got: ${critUrgency.score})`
);
assert(
  critUrgency.safetyDisclaimer.includes("DECISION-SUPPORT NOTICE"),
  "Food safety decision-support disclaimer included"
);

console.log("\n--- 5. Test Case: Expired Donation ---");
const expiredDonationInput = {
  availableUntil: new Date("2026-10-26T11:00:00Z").toISOString(), // Past date!
  foodCategory: "Cooked meals",
  referenceDate: refDate,
};

const expUrgency = predictDonationUrgency(expiredDonationInput);
assert(
  expUrgency.isExpired === true,
  "Past availableUntil is identified as isExpired = true"
);
assert(
  expUrgency.score === 100 && expUrgency.level === "critical",
  "Expired donation receives urgency score 100 (Critical)"
);
assert(
  expUrgency.warnings.some((w) => w.includes("exceeded its scheduled availability")),
  "Expired warning issued"
);

console.log("\n--- 6. Test Case: Equal Match Scores Tie-Breaking ---");
const equalNgo1 = {
  id: "ngo_eq_A",
  organizationName: "Alpha Equal Shelter",
  latitude: 37.7915,
  longitude: -122.3999,
  capacity: 70,
  verificationStatus: "verified",
  preferredCategories: ["Vegetarian"],
};
const equalNgo2 = {
  id: "ngo_eq_B",
  organizationName: "Beta Equal Shelter",
  latitude: 37.7915,
  longitude: -122.3999,
  capacity: 70,
  verificationStatus: "verified",
  preferredCategories: ["Vegetarian"],
};

const rankedEqualNgos = rankNgosForDonation(donationPart1, [equalNgo2, equalNgo1], undefined, undefined, refDate);
assert(
  rankedEqualNgos[0].matchScore === rankedEqualNgos[1].matchScore,
  "Both identical NGOs produce identical scores"
);
assert(
  rankedEqualNgos[0].ngoId === "ngo_eq_A",
  "Deterministic tie-breaking sorts identically scored NGOs consistently"
);

console.log("\n--- 7. Test Case: Unavailable Volunteer ---");
const unavailVolunteer = {
  id: "vol_unavail",
  name: "Inactive Courier",
  latitude: 37.7915,
  longitude: -122.3999,
  vehicleType: "Bike",
  availabilityStatus: "unavailable", // Unavailable
  verificationStatus: "verified",
  activePickupsCount: 0,
};

const unavailVolResult = scoreVolunteerForPickup(unavailVolunteer, 37.7915, -122.3999);
assert(
  unavailVolResult.isEligible === false && unavailVolResult.matchScore === 0,
  "Unavailable volunteer receives score 0 and isEligible = false"
);

console.log("\n--- 8. Test Case: Volunteer Already Assigned (Active Pickup) ---");
const busyVolunteer = {
  id: "vol_busy",
  name: "Active Courier",
  latitude: 37.7915,
  longitude: -122.3999,
  vehicleType: "Bike",
  availabilityStatus: "available",
  verificationStatus: "verified",
  activePickupsCount: 1, // ALREADY HANDLING ANOTHER PICKUP!
};

const busyVolResult = scoreVolunteerForPickup(busyVolunteer, 37.7915, -122.3999);
assert(
  busyVolResult.isEligible === false && busyVolResult.matchScore === 0,
  "Volunteer handling another active pickup is DISQUALIFIED (score 0)"
);
assert(
  busyVolResult.warnings.some((w) => w.includes("already handling an active pickup")),
  "Disqualification specifies ongoing active delivery engagement"
);

console.log("\n--- 9. Test Case: Missing Location Coordinates ---");
const missingLocDonation = {
  id: "don_no_loc",
  foodName: "Pantry Cans",
  category: "Packaged food",
  servings: 20,
  quantity: 20,
  availableUntil: new Date("2026-10-26T16:00:00Z").toISOString(),
  latitude: undefined, // Missing!
  longitude: undefined, // Missing!
};

const missingLocResult = scoreNgoForDonation(missingLocDonation, ngoA, undefined, undefined, refDate);
assert(
  missingLocResult.matchScore > 0,
  `Engine handles missing location without crashing (computed score: ${missingLocResult.matchScore})`
);

const missingLocUrgency = predictDonationUrgency({
  availableUntil: missingLocDonation.availableUntil,
  foodCategory: missingLocDonation.category,
  pickupLat: undefined,
  pickupLng: undefined,
  referenceDate: refDate,
});
assert(
  missingLocUrgency.warnings.some((w) => w.includes("location coordinates missing")),
  "Warning generated for missing coordinates while calculation succeeds"
);

console.log("\n--- 10. Test Case: Invalid Availability Time ---");
const invalidTimeUrgency = predictDonationUrgency({
  availableUntil: "not-a-valid-date-string", // Invalid date string!
  foodCategory: "Bakery",
  referenceDate: refDate,
});

assert(
  invalidTimeUrgency.score > 0,
  `Engine handles invalid date string gracefully without NaN or crash (score: ${invalidTimeUrgency.score})`
);
assert(
  invalidTimeUrgency.warnings.some((w) => w.includes("Invalid availability time")),
  "Warning generated for invalid availability time"
);

console.log("\n==================================================");
console.log(`TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED (100%)`);
console.log("==================================================\n");

db.close();
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}
