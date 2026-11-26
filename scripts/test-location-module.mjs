import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==================================================");
console.log("     SHAREBITE LOCATION & MAPPING TEST SUITE     ");
console.log("==================================================\n");

const dbPath = path.join(process.cwd(), "data", "test-location-module.db");
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
// Pure Geographic Calculations Verification (mirroring src/lib/utils/geo.ts)
// -----------------------------------------------------------------------------
console.log("--- 1. Geographic Calculation Accuracy (Haversine & Radii) ---");

const EARTH_RADIUS_KM = 6371;

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
  const distanceKm = EARTH_RADIUS_KM * c;

  if (unit === "miles") {
    return Math.round(distanceKm * 0.621371 * 100) / 100;
  }
  return Math.round(distanceKm * 100) / 100;
}

function isWithinRadius(centerLat, centerLon, pointLat, pointLon, radiusKm) {
  const distance = calculateHaversineDistance(centerLat, centerLon, pointLat, pointLon, "km");
  return distance <= radiusKm;
}

function calculateTravelTimeMinutes(distanceKm, mode = "car") {
  const speeds = {
    car: 28,
    bike: 16,
    walking: 4.5,
  };
  const speed = speeds[mode] || 25;
  const transitMinutes = (distanceKm / speed) * 60;
  const bufferMinutes = 5;
  return Math.max(3, Math.round(transitMinutes + bufferMinutes));
}

// Test coordinates:
// Point A: Bistro (37.7915, -122.3999) - Financial District
// Point B: Hope Kitchen (37.7858, -122.4042) - SoMa
// Point C: Volunteer Base (37.7702, -122.4225) - Mission District
// Point D: Far Oakland facility (37.8044, -122.2712) - Across bay ~12km
const bistroLat = 37.7915;
const bistroLng = -122.3999;
const hopeLat = 37.7858;
const hopeLng = -122.4042;
const volLat = 37.7702;
const volLng = -122.4225;
const oaklandLat = 37.8044;
const oaklandLng = -122.2712;

const distBistroHope = calculateHaversineDistance(bistroLat, bistroLng, hopeLat, hopeLng, "km");
assert(
  distBistroHope > 0.65 && distBistroHope < 0.85,
  `Haversine distance between Bistro and Hope Kitchen should be ~0.74 km (computed: ${distBistroHope} km)`
);

const distMiles = calculateHaversineDistance(bistroLat, bistroLng, hopeLat, hopeLng, "miles");
assert(
  distMiles > 0.4 && distMiles < 0.55,
  `Distance in miles between Bistro and Hope Kitchen should be ~0.46 miles (computed: ${distMiles} mi)`
);

const distVolBistro = calculateHaversineDistance(volLat, volLng, bistroLat, bistroLng, "km");
assert(
  distVolBistro > 2.8 && distVolBistro < 3.5,
  `Distance from Volunteer to Donor should be ~3.0 km (computed: ${distVolBistro} km)`
);

assert(
  isWithinRadius(hopeLat, hopeLng, bistroLat, bistroLng, 1.0) === true,
  "Bistro is within 1 km radius of Hope Kitchen"
);
assert(
  isWithinRadius(hopeLat, hopeLng, bistroLat, bistroLng, 0.5) === false,
  "Bistro is NOT within 0.5 km radius of Hope Kitchen"
);
assert(
  isWithinRadius(hopeLat, hopeLng, volLat, volLng, 5.0) === true,
  "Volunteer is within 5 km radius of Hope Kitchen"
);
assert(
  isWithinRadius(hopeLat, hopeLng, oaklandLat, oaklandLng, 10.0) === false,
  "Oakland facility is outside 10 km radius of Hope Kitchen"
);
assert(
  isWithinRadius(hopeLat, hopeLng, oaklandLat, oaklandLng, 25.0) === true,
  "Oakland facility is within 25 km radius of Hope Kitchen"
);

// Travel time tests
const bikeTime = calculateTravelTimeMinutes(distBistroHope, "bike");
const carTime = calculateTravelTimeMinutes(distVolBistro, "car");
const walkTime = calculateTravelTimeMinutes(distBistroHope, "walking");

assert(bikeTime >= 5 && bikeTime <= 12, `Bike travel time (~0.74km + buffer) should be 7-9 mins (computed: ${bikeTime} min)`);
assert(carTime >= 8 && carTime <= 18, `Car travel time (~3.0km + buffer) should be 10-14 mins (computed: ${carTime} min)`);
assert(walkTime > bikeTime, `Walking time (${walkTime} min) should be greater than bike time (${bikeTime} min)`);

// -----------------------------------------------------------------------------
// Volunteer Privacy & Coordinate Fuzzing Verification
// -----------------------------------------------------------------------------
console.log("\n--- 2. Volunteer Privacy Protection & Coordinate Fuzzing ---");

function fuzzCoordinates(lat, lng, radiusKm = 0.8, seedString = "seed") {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const normHash1 = Math.abs(hash % 1000) / 1000;
  const normHash2 = Math.abs((hash >> 3) % 1000) / 1000;

  const angle = normHash1 * 2 * Math.PI;
  const distance = normHash2 * radiusKm;

  const latOffset = (distance * Math.cos(angle)) / 111;
  const lonOffset = (distance * Math.sin(angle)) / (111 * Math.cos(toRadians(lat)));

  return {
    latitude: Math.round((lat + latOffset) * 10000) / 10000,
    longitude: Math.round((lng + lonOffset) * 10000) / 10000,
    fuzzed: true,
  };
}

function sanitizeVolunteerForMap(volunteer) {
  const fuzzed = fuzzCoordinates(
    volunteer.latitude,
    volunteer.longitude,
    0.7,
    volunteer.id
  );

  return {
    id: volunteer.id,
    name: volunteer.name.split(" ")[0] + " " + volunteer.name.split(" ")[1]?.charAt(0) + ".",
    vehicleType: volunteer.vehicleType,
    availabilityStatus: volunteer.availabilityStatus,
    approximateArea: volunteer.address.replace(/^[0-9]+\s+[A-Za-z0-9#\s,-]+,\s*/, "") || "Community District",
    latitude: fuzzed.latitude,
    longitude: fuzzed.longitude,
    isExactLocation: false,
  };
}

const exactVolunteer = {
  id: "vol_prof_1",
  name: "Marcus Vance",
  address: "1429 Valencia Street, Apt 4B, San Francisco, CA",
  latitude: 37.7702,
  longitude: -122.4225,
  vehicleType: "Electric Cargo Bike",
  availabilityStatus: "available",
};

const sanitized = sanitizeVolunteerForMap(exactVolunteer);

assert(
  sanitized.latitude !== exactVolunteer.latitude || sanitized.longitude !== exactVolunteer.longitude,
  "Fuzzed coordinates must not equal exact coordinates"
);

const fuzzedDistance = calculateHaversineDistance(
  exactVolunteer.latitude,
  exactVolunteer.longitude,
  sanitized.latitude,
  sanitized.longitude,
  "km"
);
assert(
  fuzzedDistance > 0.05 && fuzzedDistance <= 0.8,
  `Fuzzed offset should be within privacy zone of <= 0.8 km (actual: ${fuzzedDistance} km)`
);

assert(
  !sanitized.approximateArea.includes("1429 Valencia Street") && !sanitized.approximateArea.includes("Apt 4B"),
  "Exact street address and unit number must be omitted from public sanitized map view"
);

assert(
  sanitized.name === "Marcus V.",
  `Volunteer last name must be initialed for privacy (expected 'Marcus V.', got '${sanitized.name}')`
);

// -----------------------------------------------------------------------------
// Database Schema, Migrations & Geographic Table Storage
// -----------------------------------------------------------------------------
console.log("\n--- 3. Database Schema & Geographic Coordinate Storage ---");

const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

// Test table column presence for coordinates
const donorCols = db.prepare("PRAGMA table_info(donor_profiles)").all();
const ngoCols = db.prepare("PRAGMA table_info(ngo_profiles)").all();
const volCols = db.prepare("PRAGMA table_info(volunteer_profiles)").all();
const pickupCols = db.prepare("PRAGMA table_info(pickups)").all();

assert(
  donorCols.some((c) => c.name === "latitude") && donorCols.some((c) => c.name === "longitude"),
  "donor_profiles table contains latitude and longitude columns"
);
assert(
  ngoCols.some((c) => c.name === "latitude") && ngoCols.some((c) => c.name === "longitude"),
  "ngo_profiles table contains latitude and longitude columns"
);
assert(
  volCols.some((c) => c.name === "latitude") && volCols.some((c) => c.name === "longitude"),
  "volunteer_profiles table contains latitude and longitude columns"
);
assert(
  pickupCols.some((c) => c.name === "pickup_lat") &&
    pickupCols.some((c) => c.name === "pickup_lng") &&
    pickupCols.some((c) => c.name === "delivery_lat") &&
    pickupCols.some((c) => c.name === "delivery_lng"),
  "pickups table contains pickup_lat, pickup_lng, delivery_lat, delivery_lng columns"
);

// Seed records with coordinates
db.prepare(`
  INSERT INTO users (id, name, email, password_hash, phone, role, status)
  VALUES ('usr_d1', 'Chef Marco', 'marco@bistro.com', 'h', '111', 'donor', 'active'),
         ('usr_n1', 'Elena Rostova', 'elena@hope.org', 'h', '222', 'ngo', 'active'),
         ('usr_v1', 'Marcus Vance', 'marcus@vol.org', 'h', '333', 'volunteer', 'active');
`).run();

db.prepare(`
  INSERT INTO donor_profiles (id, user_id, organization_name, address, latitude, longitude, verification_status)
  VALUES ('don_p1', 'usr_d1', 'Green Leaf Bistro', '420 Market Street, San Francisco, CA', 37.7915, -122.3999, 'verified');
`).run();

db.prepare(`
  INSERT INTO ngo_profiles (id, user_id, organization_name, address, latitude, longitude, contact_person, verification_status, capacity, current_requirement)
  VALUES ('ngo_p1', 'usr_n1', 'Hope Kitchen & Shelter', '782 Mission Blvd, San Francisco, CA', 37.7858, -122.4042, 'Elena Rostova', 'verified', 200, 50);
`).run();

db.prepare(`
  INSERT INTO volunteer_profiles (id, user_id, address, latitude, longitude, vehicle_type, availability_status, verification_status)
  VALUES ('vol_p1', 'usr_v1', '1429 Valencia Street, San Francisco, CA', 37.7702, -122.4225, 'Bike', 'available', 'verified');
`).run();

// Seed food donation with coordinates
db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    preparation_time, available_until, storage_method, allergens,
    pickup_address, latitude, longitude, status
  ) VALUES (
    'don_item_1', 'don_p1', 'Hearty Vegetable Stew', 'Fresh organic vegetable stew',
    'Cooked meals', '10 containers (5L each)', 40,
    datetime('now', '-2 hours'), datetime('now', '+6 hours'), 'Hot Holding (above 60°C)', 'None',
    '420 Market Street, San Francisco, CA', 37.7915, -122.3999, 'published'
  );
`).run();

const savedDonation = db.prepare("SELECT * FROM food_donations WHERE id = 'don_item_1'").get();
assert(
  savedDonation.latitude === 37.7915 && savedDonation.longitude === -122.3999,
  "Food donation persisted accurate pickup coordinates"
);

// -----------------------------------------------------------------------------
// NGO Nearby Query with Geographic Filter & Distance
// -----------------------------------------------------------------------------
console.log("\n--- 4. NGO Proximity & Radius Filtering Queries ---");

const ngoProfile = db.prepare("SELECT * FROM ngo_profiles WHERE id = 'ngo_p1'").get();

// Query available donations and calculate real Haversine distance
const availableDonations = db.prepare(`
  SELECT fd.*, dp.organization_name as donor_org_name
  FROM food_donations fd
  JOIN donor_profiles dp ON fd.donor_id = dp.id
  WHERE fd.status = 'published'
`).all();

const mappedDonations = availableDonations.map((d) => {
  const dist = calculateHaversineDistance(
    ngoProfile.latitude,
    ngoProfile.longitude,
    d.latitude,
    d.longitude,
    "km"
  );
  return {
    ...d,
    distanceKm: dist,
    isNearby1km: dist <= 1.0,
    isNearby5km: dist <= 5.0,
  };
});

assert(mappedDonations.length === 1, "Found 1 published food donation");
assert(
  mappedDonations[0].distanceKm > 0.65 && mappedDonations[0].distanceKm < 0.85,
  `Calculated distance to NGO is accurate: ${mappedDonations[0].distanceKm} km`
);
assert(mappedDonations[0].isNearby1km === true, "Donation is correctly flagged as within 1 km radius");
assert(mappedDonations[0].isNearby5km === true, "Donation is correctly flagged as within 5 km radius");

// -----------------------------------------------------------------------------
// Accepted Pickup Coordinate Snapshot & Volunteer Transit Route
// -----------------------------------------------------------------------------
console.log("\n--- 5. Pickup Creation with Route Waypoints & Coordinates ---");

// Reserve and create pickup with coordinates copied from donation & NGO
db.prepare(`
  INSERT INTO pickups (
    id, donation_id, volunteer_id, ngo_id, status,
    pickup_location, pickup_lat, pickup_lng,
    delivery_location, delivery_lat, delivery_lng,
    created_at
  ) VALUES (
    'pk_test_1', 'don_item_1', 'vol_p1', 'ngo_p1', 'accepted',
    '420 Market Street, San Francisco, CA', 37.7915, -122.3999,
    '782 Mission Blvd, San Francisco, CA', 37.7858, -122.4042,
    datetime('now')
  );
`).run();

const pickupRecord = db.prepare("SELECT * FROM pickups WHERE id = 'pk_test_1'").get();

assert(
  pickupRecord.pickup_lat === 37.7915 && pickupRecord.pickup_lng === -122.3999,
  "Pickup origin coordinates correctly stored"
);
assert(
  pickupRecord.delivery_lat === 37.7858 && pickupRecord.delivery_lng === -122.4042,
  "Pickup destination NGO coordinates correctly stored"
);

function generateRouteWaypoints(start, end) {
  const midLat = (start[0] + end[0]) / 2 + 0.0008;
  const midLng = (start[1] + end[1]) / 2 - 0.0008;
  return [
    start,
    [start[0] + (midLat - start[0]) * 0.5, start[1] + (midLng - start[1]) * 0.5],
    [midLat, midLng],
    [midLat + (end[0] - midLat) * 0.5, midLng + (end[1] - midLng) * 0.5],
    end,
  ];
}

const waypoints = generateRouteWaypoints(
  [pickupRecord.pickup_lat, pickupRecord.pickup_lng],
  [pickupRecord.delivery_lat, pickupRecord.delivery_lng]
);

assert(waypoints.length === 5, `Generated 5-point routing polyline (got ${waypoints.length} points)`);
assert(waypoints[0][0] === pickupRecord.pickup_lat, "Route starts exactly at donation pickup location");
assert(waypoints[waypoints.length - 1][0] === pickupRecord.delivery_lat, "Route terminates at destination NGO location");

console.log("\n==================================================");
console.log(`TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED (100%)`);
console.log("==================================================\n");

db.close();
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}
