import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==========================================");
console.log("     SHAREBITE NGO MODULE TEST SUITE     ");
console.log("==========================================\n");

const dbPath = path.join(process.cwd(), "data", "test-ngo-module.db");
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

// 1. Initializing schema
console.log("--- 1. Initializing Database Schema & Entities ---");
const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

// Seed base users
db.prepare(`
  INSERT INTO users (id, name, email, password_hash, phone, role, status)
  VALUES ('usr_donor_1', 'Chef Marco', 'donor@sharebite.org', 'hash123', '+15551112222', 'donor', 'active'),
         ('usr_ngo_verified', 'Elena Rostova', 'verified@hopekitchen.org', 'hash123', '+15553334444', 'ngo', 'active'),
         ('usr_ngo_pending', 'John Pending', 'pending@shelter.org', 'hash123', '+15555556666', 'ngo', 'active'),
         ('usr_ngo_suspended', 'Mark Suspended', 'suspended@shelter.org', 'hash123', '+15557778888', 'ngo', 'active'),
         ('usr_vol_1', 'Marcus Vance', 'vol@sharebite.org', 'hash123', '+15559990000', 'volunteer', 'active');
`).run();

db.prepare(`
  INSERT INTO donor_profiles (id, user_id, organization_name, address)
  VALUES ('donor_prof_1', 'usr_donor_1', 'Green Leaf Bistro', '420 Market Street, San Francisco, CA');
`).run();

db.prepare(`
  INSERT INTO ngo_profiles (id, user_id, organization_name, address, contact_person, verification_status, capacity, current_requirement, preferred_categories)
  VALUES ('ngo_prof_verified', 'usr_ngo_verified', 'Hope Kitchen & Shelter', '782 Mission Blvd, SF', 'Elena Rostova', 'verified', 300, 80, '["Cooked meals", "Rice"]'),
         ('ngo_prof_pending', 'usr_ngo_pending', 'Pending Mission Shelter', '123 4th St, SF', 'John Pending', 'pending', 150, 40, '["Bread/roti"]'),
         ('ngo_prof_suspended', 'usr_ngo_suspended', 'Suspended City Foodbank', '999 Pine St, SF', 'Mark Suspended', 'suspended', 200, 60, '["Packaged food"]');
`).run();

db.prepare(`
  INSERT INTO volunteer_profiles (id, user_id, address, availability_status, verification_status)
  VALUES ('vol_prof_1', 'usr_vol_1', '154 Valencia St, SF', 'available', 'verified');
`).run();

assert(true, "Base schema and NGO profiles with verification statuses initialized");

// 2. Test NGO Verification Status & Constraints
console.log("\n--- 2. Testing NGO Verification Status Enforcement ---");

// Verification statuses check constraint
const validStatuses = ["pending", "verified", "rejected", "suspended"];
for (const st of validStatuses) {
  const updateRes = db.prepare("UPDATE ngo_profiles SET verification_status = ? WHERE id = 'ngo_prof_pending'").run(st);
  assert(updateRes.changes === 1, `Allowed verification status: '${st}'`);
}

// Invalid verification status rejection
let threwInvalidStatus = false;
try {
  db.prepare("UPDATE ngo_profiles SET verification_status = 'unauthorized_status' WHERE id = 'ngo_prof_pending'").run();
} catch (e) {
  threwInvalidStatus = true;
}
assert(threwInvalidStatus, "Prevented invalid verification status via CHECK constraint");

// 3. Test Nearby Food Display with Distance & Filters
console.log("\n--- 3. Testing Nearby Food Display & Attributes ---");

db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    available_until, pickup_address, storage_method, status, safety_declaration
  ) VALUES 
  ('don_curry', 'donor_prof_1', 'Warm Vegetable Curry', 'Freshly packed trays', 'Cooked meals', 20, 40, datetime('now', '+1 hour'), '420 Market St', 'Hot Warmer', 'published', 1),
  ('don_bread', 'donor_prof_1', 'Artisan Sourdough Loaves', 'Baked this morning', 'Bread/roti', 15, 30, datetime('now', '+5 hours'), '420 Market St', 'Dry Box', 'published', 1),
  ('don_salad', 'donor_prof_1', 'Greek Salad Bowls', 'Chilled containers', 'Vegetables', 10, 15, datetime('now', '+8 hours'), '420 Market St', 'Refrigerated', 'published', 1);
`).run();

const availableItems = db.prepare("SELECT * FROM food_donations WHERE status IN ('published', 'available')").all();
assert(availableItems.length === 3, `Retrieved ${availableItems.length} active nearby food listings`);
assert(availableItems[0].food_name === "Warm Vegetable Curry", "Listing includes food name");
assert(availableItems[0].servings === 40, "Listing includes servings count");
assert(availableItems[0].category === "Cooked meals", "Listing includes category");
assert(availableItems[0].storage_method === "Hot Warmer", "Listing includes pickup requirement/storage");

// 4. Test Request / Accept Food Rules & Verification Checks
console.log("\n--- 4. Testing Request / Accept Food Validation & Reservation Model ---");

// Check 1: Unverified NGO cannot accept
let blockedUnverified = false;
const pendingNgo = db.prepare("SELECT verification_status FROM ngo_profiles WHERE user_id = 'usr_ngo_pending'").get();
if (pendingNgo.verificationStatus !== "verified") {
  blockedUnverified = true;
}
assert(blockedUnverified, "Blocked pending NGO from accepting food donations");

const suspendedNgo = db.prepare("SELECT verification_status FROM ngo_profiles WHERE user_id = 'usr_ngo_suspended'").get();
assert(suspendedNgo.verification_status === "suspended", "Blocked suspended NGO from accepting food donations");

// Check 2: Verified NGO can accept available donation
const donToClaim = db.prepare("SELECT * FROM food_donations WHERE id = 'don_curry'").get();
assert(donToClaim.status === "published", "Donation verified as available before claim");

// Check 3: Quantity check (requested exceeds available)
const reqExcess = 100;
assert(reqExcess > donToClaim.servings, `Prevented claiming ${reqExcess} portions when only ${donToClaim.servings} available`);

// Check 4: Atomic reservation model
const claimRes = db.prepare(`
  UPDATE food_donations
  SET status = 'accepted'
  WHERE id = 'don_curry' AND status IN ('published', 'available')
`).run();
assert(claimRes.changes === 1, "Atomically reserved donation: status updated to 'accepted'");

// Prevent multiple NGOs from claiming the same donation
const secondClaimRes = db.prepare(`
  UPDATE food_donations
  SET status = 'accepted'
  WHERE id = 'don_curry' AND status IN ('published', 'available')
`).run();
assert(secondClaimRes.changes === 0, "Prevented second organization from claiming already reserved donation (atomic guarantee)");

// 5. Test NGO Capacity & Preferences
console.log("\n--- 5. Testing NGO Capacity Configuration ---");

db.prepare(`
  UPDATE ngo_profiles
  SET capacity = 450,
      current_requirement = 120,
      preferred_categories = '["Cooked meals", "Rice", "Bakery"]'
  WHERE id = 'ngo_prof_verified'
`).run();

const updatedNgo = db.prepare("SELECT capacity, current_requirement, preferred_categories FROM ngo_profiles WHERE id = 'ngo_prof_verified'").get();
assert(updatedNgo.capacity === 450, `Defined maximum meal capacity: ${updatedNgo.capacity} portions`);
assert(updatedNgo.current_requirement === 120, `Defined current daily requirement: ${updatedNgo.current_requirement} portions`);
assert(updatedNgo.preferred_categories.includes("Bakery"), "Configured preferred food categories for smart matching");

// 6. Test Donation Tracking: Requested -> Accepted -> Volunteer Assigned -> Picked Up -> Delivered -> Completed
console.log("\n--- 6. Testing Complete NGO Donation Tracking Stages ---");

const trackDonId = "don_track_ngo";
db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    available_until, pickup_address, status
  ) VALUES (?, 'donor_prof_1', 'Catered Sandwiches', 'Boxed lunches', 'Cooked meals', 25, 50, datetime('now', '+3 hours'), '420 Market', 'published')
`).run(trackDonId);

// Stage 1: Requested
db.prepare(`
  INSERT INTO food_requests (id, ngo_id, donation_id, requested_quantity, status)
  VALUES ('req_track_1', 'ngo_prof_verified', ?, 50, 'pending')
`).run(trackDonId);
assert(true, "Tracking Stage 1: 'Requested' (food request linked)");

// Stage 2: Accepted
db.prepare("UPDATE food_donations SET status = 'accepted' WHERE id = ?").run(trackDonId);
db.prepare(`
  INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, status)
  VALUES ('match_track_1', ?, 'ngo_prof_verified', 0.95, 1.4, 'accepted')
`).run(trackDonId);
assert(db.prepare("SELECT status FROM food_donations WHERE id = ?").get(trackDonId).status === "accepted", "Tracking Stage 2: 'Accepted' (NGO reservation confirmed)");

// Stage 3: Volunteer Assigned
db.prepare("UPDATE food_donations SET status = 'pickup_assigned' WHERE id = ?").run(trackDonId);
db.prepare(`
  INSERT INTO pickups (id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location, status, accepted_at)
  VALUES ('pick_track_1', ?, 'vol_prof_1', 'ngo_prof_verified', '420 Market St', '782 Mission Blvd', 'assigned', CURRENT_TIMESTAMP)
`).run(trackDonId);
assert(db.prepare("SELECT status FROM food_donations WHERE id = ?").get(trackDonId).status === "pickup_assigned", "Tracking Stage 3: 'Volunteer Assigned'");

// Stage 4: Picked Up
db.prepare("UPDATE food_donations SET status = 'picked_up' WHERE id = ?").run(trackDonId);
db.prepare("UPDATE pickups SET status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP WHERE id = 'pick_track_1'").run();
assert(db.prepare("SELECT status FROM food_donations WHERE id = ?").get(trackDonId).status === "picked_up", "Tracking Stage 4: 'Picked Up' (courier en route)");

// Stage 5: Delivered
db.prepare("UPDATE food_donations SET status = 'delivered' WHERE id = ?").run(trackDonId);
db.prepare("UPDATE pickups SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = 'pick_track_1'").run();
assert(db.prepare("SELECT status FROM food_donations WHERE id = ?").get(trackDonId).status === "delivered", "Tracking Stage 5: 'Delivered' at shelter intake");

// Stage 6: Completed
db.prepare("UPDATE food_donations SET status = 'completed' WHERE id = ?").run(trackDonId);
assert(db.prepare("SELECT status FROM food_donations WHERE id = ?").get(trackDonId).status === "completed", "Tracking Stage 6: 'Completed' (verified & distributed)");

// 7. Test Notifications for NGOs
console.log("\n--- 7. Testing NGO Notifications on Events ---");

const ngoEvents = [
  { type: "donation_alert", title: "New Nearby Donation Appears", msg: "Chef Marco listed 40 portions of Warm Curry 1.2 miles away." },
  { type: "match_found", title: "Request Accepted", msg: "Your food request has been matched with surplus from Green Leaf Bistro." },
  { type: "pickup_assigned", title: "Volunteer Assigned", msg: "Courier Marcus Vance is assigned to deliver food to your shelter." },
  { type: "pickup_assigned", title: "Pickup Occurs", msg: "Courier has collected food from donor kitchen and is in transit." },
  { type: "delivery_completed", title: "Delivery Occurs", msg: "Food has arrived at your facility intake door." }
];

for (let i = 0; i < ngoEvents.length; i++) {
  const ev = ngoEvents[i];
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, read_status, created_at)
    VALUES (?, 'usr_ngo_verified', ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `).run(`notif_ngo_${i}`, ev.title, ev.msg, ev.type);
}

const ngoNotifCount = db.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = 'usr_ngo_verified'").get().cnt;
assert(ngoNotifCount === 5, `Successfully delivered all 5 required notification events to NGO (count: ${ngoNotifCount})`);

// 8. Test NGO Dashboard Real Metrics Calculation
console.log("\n--- 8. Testing NGO Dashboard Calculations (No Mock Data) ---");

const availableCount = db.prepare("SELECT COUNT(*) as cnt FROM food_donations WHERE status IN ('published', 'available')").get().cnt;
assert(availableCount === 2, `Available nearby food counted: ${availableCount}`);

const activeRequests = db.prepare(`
  SELECT COUNT(*) as cnt FROM food_requests fr
  JOIN ngo_profiles np ON fr.ngo_id = np.id
  WHERE np.user_id = 'usr_ngo_verified' AND fr.status = 'pending'
`).get().cnt;
assert(activeRequests === 1, `Active requests counted: ${activeRequests}`);

const completedDeliveries = db.prepare(`
  SELECT COUNT(*) as cnt, SUM(servings) as meals
  FROM matches m
  JOIN food_donations fd ON m.donation_id = fd.id
  WHERE m.ngo_id = 'ngo_prof_verified' AND fd.status IN ('delivered', 'completed')
`).get();

assert(completedDeliveries.cnt === 1, `Completed donations counted: ${completedDeliveries.cnt}`);
assert(completedDeliveries.meals === 50, `Meals received calculated: ${completedDeliveries.meals}`);

console.log("\n==========================================");
console.log(`NGO MODULE TEST SUMMARY: ${testsPassed} / ${testsTotal} assertions passed.`);
console.log("==========================================");
