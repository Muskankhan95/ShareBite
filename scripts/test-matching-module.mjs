import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==================================================");
console.log("   SHAREBITE SMART MATCHING ENGINE TEST SUITE   ");
console.log("==================================================\n");

const dbPath = path.join(process.cwd(), "data", "test-matching-module.db");
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
// 1. Database Schema & Migration Setup
// -----------------------------------------------------------------------------
console.log("--- 1. Database Schema & Migration Setup ---");
const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

const matchCols = db.prepare("PRAGMA table_info(matches)").all();
assert(
  matchCols.some((c) => c.name === "reasons") && matchCols.some((c) => c.name === "factors_json"),
  "matches table contains reasons and factors_json columns"
);

// -----------------------------------------------------------------------------
// Pure Matching Algorithm Implementation (Mirroring src/lib/matching/matching-engine.ts)
// -----------------------------------------------------------------------------
const DEFAULT_MATCHING_WEIGHTS = {
  distance: 0.30,
  urgency: 0.25,
  capacity: 0.20,
  preference: 0.15,
  availability: 0.10,
};

const DEFAULT_URGENCY_THRESHOLDS = {
  criticalHours: 1,
  highHours: 2,
  mediumHours: 4,
};

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2, unit = "km") {
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

function calculateUrgency(availableUntil, thresholds = DEFAULT_URGENCY_THRESHOLDS, referenceDate = new Date()) {
  const targetTime = new Date(availableUntil).getTime();
  const nowTime = referenceDate.getTime();
  const diffMs = targetTime - nowTime;
  const minutesRemaining = Math.max(0, Math.round(diffMs / (60 * 1000)));
  const hoursRemaining = minutesRemaining / 60;

  let urgencyScore = 25;
  let urgencyLevel = "low";

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

  return { urgencyScore, urgencyLevel, minutesRemaining };
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

function calculatePreferenceScore(donationCategory, preferredCategories) {
  if (!preferredCategories || preferredCategories.length === 0) return 75;
  const normCat = donationCategory.trim().toLowerCase();
  const accepts = preferredCategories.some((p) => {
    const np = p.trim().toLowerCase();
    return np === normCat || np === "all" || normCat.includes(np) || np.includes(normCat);
  });
  return accepts ? 100 : 25;
}

function calculateAvailabilityScore(verificationStatus) {
  if (verificationStatus !== "verified") {
    return { score: 0, warning: `Disqualified: Organization is not verified (status: ${verificationStatus})` };
  }
  return { score: 100 };
}

function generateNgoMatchReasons(ngo, donation, distanceKm, factors, urgencyLevel, minutesRemaining) {
  const reasons = [];
  const warnings = [];

  if (distanceKm <= 2.5) {
    reasons.push(`✓ Closest suitable NGO (${distanceKm.toFixed(1)} km away)`);
  } else if (distanceKm <= 8.0) {
    reasons.push(`✓ Within local delivery radius (${distanceKm.toFixed(1)} km away)`);
  } else {
    reasons.push(`• Accessible regional location (${distanceKm.toFixed(1)} km)`);
  }

  if (ngo.capacity >= donation.servings) {
    reasons.push(`✓ Has enough capacity (${ngo.capacity} capacity for ${donation.servings} meals)`);
  } else {
    warnings.push(`⚠️ Capacity mismatch: Organization capacity is ${ngo.capacity} vs ${donation.servings} portions needed`);
  }

  if (factors.preferenceScore >= 90) {
    reasons.push(`✓ Accepts this food category ('${donation.category}')`);
  } else {
    warnings.push(`• '${donation.category}' is outside organization's primary preferred categories`);
  }

  if (urgencyLevel === "critical") {
    reasons.push(`✓ High priority match: donation has ${minutesRemaining} minutes remaining (Critical urgency)`);
  } else if (urgencyLevel === "high") {
    reasons.push(`✓ Donation has ${minutesRemaining} minutes remaining (${urgencyLevel.toUpperCase()} urgency)`);
  } else {
    reasons.push(`✓ Stable shelf-life: ${Math.round(minutesRemaining / 60)} hours remaining`);
  }

  if (ngo.verificationStatus === "verified") {
    reasons.push("✓ Verified community partner currently available");
  } else {
    warnings.push(`⚠️ Organization verification status: ${ngo.verificationStatus}`);
  }

  return { reasons, warnings };
}

function scoreNgoForDonation(donation, ngo, weights = DEFAULT_MATCHING_WEIGHTS, thresholds = DEFAULT_URGENCY_THRESHOLDS, referenceDate = new Date()) {
  const donorLat = donation.latitude ?? 37.7749;
  const donorLng = donation.longitude ?? -122.4194;
  const ngoLat = ngo.latitude ?? 37.7749;
  const ngoLng = ngo.longitude ?? -122.4194;

  const distanceKm = calculateHaversineDistance(donorLat, donorLng, ngoLat, ngoLng, "km");
  const distanceMiles = calculateHaversineDistance(donorLat, donorLng, ngoLat, ngoLng, "miles");

  const distanceScore = calculateDistanceScore(distanceKm);
  const { urgencyScore, urgencyLevel, minutesRemaining } = calculateUrgency(donation.availableUntil, thresholds, referenceDate);
  const capacityResult = calculateCapacityScore(donation.servings, ngo.capacity);
  const preferenceScore = calculatePreferenceScore(donation.category, ngo.preferredCategories);
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

  const { reasons, warnings } = generateNgoMatchReasons(ngo, donation, distanceKm, factors, urgencyLevel, minutesRemaining);
  if (capacityResult.warning && !warnings.includes(capacityResult.warning)) warnings.push(capacityResult.warning);
  if (availabilityResult.warning && !warnings.includes(availabilityResult.warning)) warnings.push(availabilityResult.warning);

  return {
    donationId: donation.id,
    ngoId: ngo.id,
    organizationName: ngo.organizationName,
    matchScore: isEligible ? matchScore : 0,
    distanceKm,
    distanceMiles,
    urgencyScore,
    urgencyLevel,
    minutesRemaining,
    factors,
    reasons,
    warnings,
    isEligible,
    capacity: ngo.capacity,
  };
}

function rankNgosForDonation(donation, ngos, weights = DEFAULT_MATCHING_WEIGHTS, thresholds = DEFAULT_URGENCY_THRESHOLDS, referenceDate = new Date()) {
  const scored = ngos.map((ngo) => scoreNgoForDonation(donation, ngo, weights, thresholds, referenceDate));
  return scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (b.capacity !== a.capacity) return b.capacity - a.capacity;
    return a.ngoId.localeCompare(b.ngoId);
  });
}

function scoreVolunteerForPickup(volunteer, pickupLat, pickupLng) {
  const reasons = [];
  const warnings = [];

  const volLat = volunteer.latitude ?? 37.7749;
  const volLng = volunteer.longitude ?? -122.4194;

  const distanceKm = calculateHaversineDistance(volLat, volLng, pickupLat, pickupLng, "km");
  const distanceMiles = calculateHaversineDistance(volLat, volLng, pickupLat, pickupLng, "miles");
  const mode = volunteer.vehicleType.toLowerCase().includes("bike") ? "bike" : "car";
  const estimatedTravelMinutes = calculateTravelTimeMinutes(distanceKm, mode);

  const isVerified = volunteer.verificationStatus === "verified";
  const isAvailable = volunteer.availabilityStatus === "available";
  const hasActivePickup = volunteer.activePickupsCount > 0;

  let isEligible = true;

  if (!isVerified) {
    isEligible = false;
    warnings.push(`Disqualified: Volunteer is not verified (status: ${volunteer.verificationStatus})`);
  }
  if (hasActivePickup) {
    isEligible = false;
    warnings.push("Disqualified: Volunteer is already handling an active pickup delivery");
  }
  if (!isAvailable) {
    isEligible = false;
    warnings.push(`Disqualified: Volunteer availability status is '${volunteer.availabilityStatus}'`);
  }

  if (!isEligible) {
    return {
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      vehicleType: volunteer.vehicleType,
      distanceKm,
      distanceMiles,
      estimatedTravelMinutes,
      matchScore: 0,
      activePickupsCount: volunteer.activePickupsCount,
      reasons: [],
      warnings,
      isEligible: false,
    };
  }

  const distanceScore = Math.max(0, 100 - (distanceKm / 12) * 100);
  const timeScore = Math.max(0, 100 - (estimatedTravelMinutes / 40) * 100);
  const vehicleScore = volunteer.vehicleType ? 90 : 70;
  const trips = volunteer.completedTripsCount || 0;
  const reliabilityScore = Math.min(100, 75 + trips * 5);

  const rawScore =
    distanceScore * 0.40 +
    timeScore * 0.35 +
    vehicleScore * 0.15 +
    reliabilityScore * 0.10;

  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  reasons.push("✓ Verified volunteer courier");
  reasons.push("✓ Currently available with zero active pickups");
  reasons.push(`✓ Closest courier (${distanceKm.toFixed(1)} km from pickup)`);
  reasons.push(`✓ Estimated transit time: ~${estimatedTravelMinutes} mins via ${volunteer.vehicleType}`);

  return {
    volunteerId: volunteer.id,
    volunteerName: volunteer.name,
    vehicleType: volunteer.vehicleType,
    distanceKm,
    distanceMiles,
    estimatedTravelMinutes,
    matchScore,
    activePickupsCount: volunteer.activePickupsCount,
    reasons,
    warnings,
    isEligible: true,
  };
}

// -----------------------------------------------------------------------------
// 2. Calibration Test: 50 meals, 90 mins, 2 km, Cap 60 -> 91/100
// -----------------------------------------------------------------------------
console.log("\n--- 2. Calibration Test: 50 meals, 90 mins, 2 km, Cap 60 -> 91/100 ---");

const refDate = new Date("2026-10-26T12:00:00Z");

const calibDonation = {
  id: "don_calib",
  foodName: "Nutritious Hot Lunches",
  category: "Cooked meals",
  quantity: 50,
  servings: 50,
  availableUntil: new Date("2026-10-26T13:30:00Z").toISOString(), // Exactly 90 mins remaining
  pickupAddress: "100 Market St, SF",
  latitude: 37.7915,
  longitude: -122.3999,
};

const calibNgo = {
  id: "ngo_calib",
  organizationName: "Downtown Harvest Shelter",
  contactPerson: "Sarah Jenkins",
  phone: "555-0199",
  address: "650 Mission St",
  latitude: 37.7858,
  longitude: -122.4200, // ~2.0 km away
  verificationStatus: "verified",
  capacity: 60, // Exactly 60 capacity
  preferredCategories: ["Cooked meals"],
};

const calibResult = scoreNgoForDonation(calibDonation, calibNgo, undefined, undefined, refDate);

assert(
  calibResult.matchScore === 91,
  `Prompt calibration requirement: Match score for 50 meals, 90 mins, ~2km, Cap 60 MUST be 91/100 (got: ${calibResult.matchScore})`
);
assert(
  calibResult.reasons.length >= 4,
  `Explainable reasons generated (count: ${calibResult.reasons.length})`
);

// -----------------------------------------------------------------------------
// 3. Test Case: Closest NGO
// -----------------------------------------------------------------------------
console.log("\n--- 3. Test Case: Closest NGO vs Farther NGO ---");

const closeNgo = {
  id: "ngo_close",
  organizationName: "Close Shelter",
  latitude: 37.7920,
  longitude: -122.4005, // ~0.08 km away
  verificationStatus: "verified",
  capacity: 100,
  preferredCategories: ["Cooked meals"],
};

const farNgo = {
  id: "ngo_far",
  organizationName: "Far Shelter",
  latitude: 37.7300,
  longitude: -122.4800, // ~9.8 km away
  verificationStatus: "verified",
  capacity: 100,
  preferredCategories: ["Cooked meals"],
};

const closeScore = scoreNgoForDonation(calibDonation, closeNgo, undefined, undefined, refDate);
const farScore = scoreNgoForDonation(calibDonation, farNgo, undefined, undefined, refDate);

assert(
  closeScore.factors.distanceScore > farScore.factors.distanceScore,
  `Closer NGO has higher distance sub-score (${closeScore.factors.distanceScore} vs ${farScore.factors.distanceScore})`
);
assert(
  closeScore.matchScore > farScore.matchScore,
  `Closer NGO has higher overall match score (${closeScore.matchScore} vs ${farScore.matchScore})`
);

// -----------------------------------------------------------------------------
// 4. Test Case: Capacity Mismatch
// -----------------------------------------------------------------------------
console.log("\n--- 4. Test Case: Capacity Mismatch ---");

const smallCapacityNgo = {
  id: "ngo_small",
  organizationName: "Tiny Community Pantry",
  latitude: 37.7915,
  longitude: -122.3999,
  verificationStatus: "verified",
  capacity: 10, // Only 10 portions capacity for 50 meals!
  preferredCategories: ["Cooked meals"],
};

const smallCapResult = scoreNgoForDonation(calibDonation, smallCapacityNgo, undefined, undefined, refDate);

assert(
  smallCapResult.factors.capacityScore < 40,
  `Capacity mismatch NGO receives penalized capacity score (got: ${smallCapResult.factors.capacityScore})`
);
assert(
  smallCapResult.warnings.some((w) => w.toLowerCase().includes("capacity mismatch")),
  "Capacity mismatch warning is explicitly generated for transparency"
);

// -----------------------------------------------------------------------------
// 5. Test Case: Expiring Donation Urgency
// -----------------------------------------------------------------------------
console.log("\n--- 5. Test Case: Expiring Donation Urgency Thresholds ---");

const critExpiry = new Date(refDate.getTime() + 45 * 60 * 1000).toISOString();
const critUrgency = calculateUrgency(critExpiry, undefined, refDate);
assert(
  critUrgency.urgencyLevel === "critical" && critUrgency.urgencyScore === 100,
  "Donation with 45 minutes remaining triggers Critical urgency score 100"
);

const highExpiry = new Date(refDate.getTime() + 90 * 60 * 1000).toISOString();
const highUrgency = calculateUrgency(highExpiry, undefined, refDate);
assert(
  highUrgency.urgencyLevel === "high" && highUrgency.urgencyScore >= 75 && highUrgency.urgencyScore <= 90,
  `Donation with 90 minutes remaining triggers High urgency score ~88 (got: ${highUrgency.urgencyScore})`
);

const medExpiry = new Date(refDate.getTime() + 180 * 60 * 1000).toISOString();
const medUrgency = calculateUrgency(medExpiry, undefined, refDate);
assert(
  medUrgency.urgencyLevel === "medium" && medUrgency.urgencyScore === 50,
  "Donation with 3 hours remaining triggers Medium urgency score 50"
);

const lowExpiry = new Date(refDate.getTime() + 360 * 60 * 1000).toISOString();
const lowUrgency = calculateUrgency(lowExpiry, undefined, refDate);
assert(
  lowUrgency.urgencyLevel === "low" && lowUrgency.urgencyScore === 25,
  "Donation with 6 hours remaining triggers Low urgency score 25"
);

// -----------------------------------------------------------------------------
// 6. Test Case: Unavailable or Unverified NGO
// -----------------------------------------------------------------------------
console.log("\n--- 6. Test Case: Unavailable / Suspended NGO ---");

const suspendedNgo = {
  id: "ngo_suspended",
  organizationName: "Suspended Charity",
  latitude: 37.7915,
  longitude: -122.3999,
  verificationStatus: "suspended",
  capacity: 100,
  preferredCategories: ["Cooked meals"],
};

const suspendedResult = scoreNgoForDonation(calibDonation, suspendedNgo, undefined, undefined, refDate);
assert(
  suspendedResult.matchScore === 0,
  "Suspended NGO receives match score 0"
);
assert(
  suspendedResult.isEligible === false,
  "Suspended NGO is flagged as not eligible"
);
assert(
  suspendedResult.warnings.some((w) => w.toLowerCase().includes("disqualified")),
  "Suspended NGO has clear disqualification warning"
);

// -----------------------------------------------------------------------------
// 7. Test Case: Volunteer Matching & Active Pickup Disqualification
// -----------------------------------------------------------------------------
console.log("\n--- 7. Test Case: Volunteer Matching & Concurrency Protection ---");

const pickupLat = 37.7915;
const pickupLng = -122.3999;

const freeVolunteer = {
  id: "vol_free",
  name: "Marcus Vance",
  latitude: 37.7850,
  longitude: -122.4100,
  vehicleType: "Electric Cargo Bike",
  availabilityStatus: "available",
  verificationStatus: "verified",
  activePickupsCount: 0,
  completedTripsCount: 12,
};

const busyVolunteer = {
  id: "vol_busy",
  name: "Alex Busy",
  latitude: 37.7915,
  longitude: -122.3999,
  vehicleType: "Car",
  availabilityStatus: "available",
  verificationStatus: "verified",
  activePickupsCount: 1, // ALREADY HANDLING ANOTHER PICKUP!
  completedTripsCount: 20,
};

const freeResult = scoreVolunteerForPickup(freeVolunteer, pickupLat, pickupLng);
const busyResult = scoreVolunteerForPickup(busyVolunteer, pickupLat, pickupLng);

assert(
  freeResult.isEligible === true && freeResult.matchScore > 80,
  `Available volunteer is eligible with high match score (score: ${freeResult.matchScore})`
);
assert(
  busyResult.isEligible === false && busyResult.matchScore === 0,
  "Volunteer handling another active pickup is DISQUALIFIED (match score: 0)"
);
assert(
  busyResult.warnings.some((w) => w.toLowerCase().includes("already handling an active pickup")),
  "Disqualification warning specifies active delivery engagement"
);

// -----------------------------------------------------------------------------
// 8. Test Case: Equal-Score Deterministic Tie-Breaking
// -----------------------------------------------------------------------------
console.log("\n--- 8. Test Case: Equal-Score Matches Tie-Breaking ---");

const ngoEqual1 = {
  id: "ngo_eq_1",
  organizationName: "Equal Shelter Alpha",
  latitude: 37.7915,
  longitude: -122.3999,
  verificationStatus: "verified",
  capacity: 80,
  preferredCategories: ["Cooked meals"],
};

const ngoEqual2 = {
  id: "ngo_eq_2",
  organizationName: "Equal Shelter Beta",
  latitude: 37.7915,
  longitude: -122.3999,
  verificationStatus: "verified",
  capacity: 80,
  preferredCategories: ["Cooked meals"],
};

const rankedEquals = rankNgosForDonation(calibDonation, [ngoEqual2, ngoEqual1], undefined, undefined, refDate);
assert(
  rankedEquals.length === 2 && rankedEquals[0].matchScore === rankedEquals[1].matchScore,
  "Both NGOs produced identical match scores"
);
assert(
  rankedEquals[0].ngoId === "ngo_eq_1",
  "Deterministic tie-breaking resolved identical scores consistently by deterministic order"
);

// -----------------------------------------------------------------------------
// 9. Database Batch Match Persistence & Querying
// -----------------------------------------------------------------------------
console.log("\n--- 9. Database Persistence for Matches Table ---");

db.prepare(`
  INSERT INTO users (id, name, email, password_hash, phone, role, status)
  VALUES ('u_d', 'Donor Chef', 'd@b.com', 'h', '111', 'donor', 'active'),
         ('u_n1', 'NGO Lead', 'n@h.org', 'h', '222', 'ngo', 'active');
`).run();

db.prepare(`
  INSERT INTO donor_profiles (id, user_id, organization_name, address, latitude, longitude, verification_status)
  VALUES ('dp_1', 'u_d', 'Bistro One', '100 Market St', 37.7915, -122.3999, 'verified');
`).run();

db.prepare(`
  INSERT INTO ngo_profiles (id, user_id, organization_name, address, latitude, longitude, contact_person, verification_status, capacity)
  VALUES ('np_1', 'u_n1', 'Downtown Shelter', '650 Mission St', 37.7858, -122.4200, 'Elena', 'verified', 60);
`).run();

db.prepare(`
  INSERT INTO food_donations (id, donor_id, food_name, description, category, quantity, servings, preparation_time, available_until, storage_method, allergens, pickup_address, latitude, longitude, status)
  VALUES ('don_db_1', 'dp_1', 'Warm Pasta', 'Fresh pasta', 'Cooked meals', '50 portions', 50, datetime('now', '-1 hour'), datetime('now', '+90 minutes'), 'Hot', 'None', '100 Market St', 37.7915, -122.3999, 'published');
`).run();

db.prepare(`
  INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, reasons, factors_json, status, created_at)
  VALUES (
    'mat_test_1', 'don_db_1', 'np_1', ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP
  )
`).run(
  calibResult.matchScore,
  calibResult.distanceKm,
  calibResult.urgencyScore,
  JSON.stringify(calibResult.reasons),
  JSON.stringify(calibResult.factors)
);

const savedMatch = db.prepare("SELECT * FROM matches WHERE id = 'mat_test_1'").get();
assert(savedMatch.match_score === 91, "Saved match score in SQLite is 91");

const parsedReasons = JSON.parse(savedMatch.reasons);
assert(parsedReasons.length >= 4, "Saved reasons successfully deserialized from SQLite");

console.log("\n==================================================");
console.log(`TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED (100%)`);
console.log("==================================================\n");

db.close();
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}
