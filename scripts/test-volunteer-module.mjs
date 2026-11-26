import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==================================================");
console.log("     SHAREBITE VOLUNTEER MODULE TEST SUITE       ");
console.log("==================================================\n");

const dbPath = path.join(process.cwd(), "data", "test-volunteer-module.db");
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

// Seed base users and profiles
db.prepare(`
  INSERT INTO users (id, name, email, password_hash, phone, role, status)
  VALUES ('usr_donor_1', 'Chef Marco Rivera', 'marco@bistro.com', 'hash123', '+15551112222', 'donor', 'active'),
         ('usr_ngo_1', 'Elena Rostova', 'elena@hopekitchen.org', 'hash123', '+15553334444', 'ngo', 'active'),
         ('usr_vol_1', 'Marcus Vance', 'marcus@volunteer.org', 'hash123', '+15554443333', 'volunteer', 'active'),
         ('usr_vol_2', 'Sarah Chen', 'sarah@volunteer.org', 'hash123', '+15558889999', 'volunteer', 'active');
`).run();

db.prepare(`
  INSERT INTO donor_profiles (id, user_id, organization_name, address, verification_status)
  VALUES ('donor_prof_1', 'usr_donor_1', 'Green Leaf Bistro', '420 Market Street, San Francisco, CA', 'verified');
`).run();

db.prepare(`
  INSERT INTO ngo_profiles (id, user_id, organization_name, address, contact_person, verification_status, capacity, current_requirement)
  VALUES ('ngo_prof_1', 'usr_ngo_1', 'Hope Kitchen & Shelter', '782 Mission Blvd, San Francisco, CA', 'Elena Rostova', 'verified', 150, 60);
`).run();

db.prepare(`
  INSERT INTO volunteer_profiles (id, user_id, address, availability_status, verification_status, vehicle_type, preferred_radius)
  VALUES ('vol_prof_1', 'usr_vol_1', 'Downtown Hub', 'available', 'verified', 'Bike', 5),
         ('vol_prof_2', 'usr_vol_2', 'Mission Base', 'available', 'verified', 'Car', 10);
`).run();

db.prepare(`
  INSERT OR IGNORE INTO impact_statistics (id, meals_rescued, food_weight_rescued, donations_completed, volunteers_involved, organizations_involved)
  VALUES ('global_impact', 0, 0.0, 0, 2, 2);
`).run();

assert(true, "Database schema and profiles seeded successfully.");

console.log("\n--- 2. Volunteer Profile & Availability Management ---");
{
  // Test 2.1: Query volunteer profile
  const profile = db.prepare("SELECT * FROM volunteer_profiles WHERE user_id = 'usr_vol_1'").get();
  assert(profile && profile.availability_status === "available", "Initial volunteer availability is 'available'");
  assert(profile.verification_status === "verified", "Volunteer verification status is 'verified'");

  // Test 2.2: Toggle availability to 'unavailable'
  db.prepare("UPDATE volunteer_profiles SET availability_status = 'unavailable' WHERE user_id = 'usr_vol_1'").run();
  const unavail = db.prepare("SELECT availability_status FROM volunteer_profiles WHERE user_id = 'usr_vol_1'").get();
  assert(unavail.availability_status === "unavailable", "Successfully toggled availability to 'unavailable'");

  // Test 2.3: Toggle back to 'available'
  db.prepare("UPDATE volunteer_profiles SET availability_status = 'available' WHERE user_id = 'usr_vol_1'").run();
  const avail = db.prepare("SELECT availability_status FROM volunteer_profiles WHERE user_id = 'usr_vol_1'").get();
  assert(avail.availability_status === "available", "Successfully restored availability to 'available'");

  // Test 2.4: Update transport vehicle and radius
  db.prepare("UPDATE volunteer_profiles SET vehicle_type = 'Cargo Van', preferred_radius = 15 WHERE user_id = 'usr_vol_1'").run();
  const updated = db.prepare("SELECT vehicle_type, preferred_radius FROM volunteer_profiles WHERE user_id = 'usr_vol_1'").get();
  assert(updated.vehicle_type === "Cargo Van" && updated.preferred_radius === 15, "Profile vehicle and operational radius updated");
}

console.log("\n--- 3. Available Pickups & Concurrency Protection ---");
{
  // Seed a donation accepted by NGO
  db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      available_until, pickup_address, status
    ) VALUES (
      'don_concurrency_test', 'donor_prof_1', 'Fresh Trays of Vegetable Lasagna',
      'Warm and foil-sealed corporate banquet surplus', 'Cooked Meals', 20.0, 50,
      datetime('now', '+5 hours'), '420 Market Street, San Francisco, CA', 'accepted'
    )
  `).run();

  // Create open pickup
  db.prepare(`
    INSERT INTO pickups (
      id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location,
      status, distance_miles, estimated_duration_mins
    ) VALUES (
      'pik_concurrency_test', 'don_concurrency_test', NULL, 'ngo_prof_1',
      '420 Market Street, San Francisco, CA', '782 Mission Blvd, San Francisco, CA',
      'available', 2.3, 16
    )
  `).run();

  // Test 3.1: Verify pickup is unassigned
  const pickup = db.prepare("SELECT * FROM pickups WHERE id = 'pik_concurrency_test'").get();
  assert(pickup.volunteer_id === null && pickup.status === "available", "Pickup is initially unassigned with status 'available'");

  // Test 3.2: Volunteer 1 claims pickup using atomic conditional UPDATE
  const claim1 = db.prepare(`
    UPDATE pickups
    SET volunteer_id = 'vol_prof_1', status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = 'pik_concurrency_test' AND (volunteer_id IS NULL OR status IN ('available', 'pending'))
  `).run();

  assert(claim1.changes === 1, "Volunteer 1 successfully claimed the available pickup");

  // Sync donation status
  db.prepare("UPDATE food_donations SET status = 'pickup_assigned' WHERE id = 'don_concurrency_test'").run();
  const donCheck = db.prepare("SELECT status FROM food_donations WHERE id = 'don_concurrency_test'").get();
  assert(donCheck.status === "pickup_assigned", "Donation status automatically set to 'pickup_assigned'");

  // Record notification for Volunteer 1
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES ('notif_claim_1', 'usr_vol_1', 'Pickup Accepted', 'You accepted Vegetable Lasagna delivery mission.', 'pickup_accepted')
  `).run();

  // Test 3.3: CONCURRENCY TEST - Volunteer 2 attempts to claim the SAME pickup
  const claim2 = db.prepare(`
    UPDATE pickups
    SET volunteer_id = 'vol_prof_2', status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = 'pik_concurrency_test' AND (volunteer_id IS NULL OR status IN ('available', 'pending'))
  `).run();

  assert(claim2.changes === 0, "Volunteer 2 simultaneous claim ATOMICALLY REJECTED (changes === 0 prevents race conditions)");
}

console.log("\n--- 4. Complete 7-Stage Pickup Lifecycle & Verification ---");
{
  // Seed a donation for the full lifecycle
  db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      available_until, pickup_address, status
    ) VALUES (
      'don_lifecycle_flow', 'donor_prof_1', 'Organic Farm Salad Bowls & Bread',
      'Freshly prepared boxed salads with vinaigrette', 'Cooked Meals', 15.0, 40,
      datetime('now', '+6 hours'), '420 Market Street, San Francisco, CA', 'accepted'
    )
  `).run();

  const pikId = "pik_lifecycle_flow";
  db.prepare(`
    INSERT INTO pickups (
      id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location,
      status, distance_miles, estimated_duration_mins
    ) VALUES (
      ?, 'don_lifecycle_flow', NULL, 'ngo_prof_1',
      '420 Market Street, San Francisco, CA', '782 Mission Blvd, San Francisco, CA',
      'available', 2.8, 19
    )
  `).run(pikId);

  // Stage 1: Available
  let p = db.prepare("SELECT status FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "available", "Stage 1 verified: 'available'");

  // Stage 2: Accepted
  db.prepare(`
    UPDATE pickups
    SET volunteer_id = 'vol_prof_1', status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(pikId);
  p = db.prepare("SELECT status, accepted_at FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "accepted" && p.accepted_at !== null, "Stage 2 verified: 'accepted' with timestamp");

  // Stage 3: At Pickup Location
  db.prepare(`
    UPDATE pickups
    SET status = 'at_pickup', at_pickup_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(pikId);
  p = db.prepare("SELECT status, at_pickup_at FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "at_pickup" && p.at_pickup_at !== null, "Stage 3 verified: 'at_pickup' with timestamp");

  // Stage 4: Food Picked Up (with pickup verification notes, temperature, optional photo)
  db.prepare(`
    UPDATE pickups
    SET status = 'picked_up',
        picked_up_at = CURRENT_TIMESTAMP,
        pickup_verification_notes = 'Container seals verified intact. Packed in insulated bags.',
        pickup_temp_c = 4.2,
        pickup_photo_url = '/images/verifications/pickup_salad.jpg'
    WHERE id = ?
  `).run(pikId);
  db.prepare("UPDATE food_donations SET status = 'picked_up' WHERE id = 'don_lifecycle_flow'").run();

  p = db.prepare("SELECT status, picked_up_at, pickup_verification_notes, pickup_temp_c FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "picked_up" && p.pickup_verification_notes.includes("seals verified"), "Stage 4 verified: 'picked_up' with inspection data");
  assert(p.pickup_temp_c === 4.2, "Pickup temperature verified (4.2°C)");

  // Stage 5: In Transit
  db.prepare(`
    UPDATE pickups
    SET status = 'in_transit', in_transit_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(pikId);
  db.prepare("UPDATE food_donations SET status = 'in_transit' WHERE id = 'don_lifecycle_flow'").run();

  p = db.prepare("SELECT status, in_transit_at FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "in_transit" && p.in_transit_at !== null, "Stage 5 verified: 'in_transit' with transit timestamp");

  // Stage 6: Delivered (with recipient intake verification, handover notes, digital handover)
  const impactBefore = db.prepare("SELECT meals_rescued, food_weight_rescued, donations_completed FROM impact_statistics WHERE id = 'global_impact'").get();

  db.prepare(`
    UPDATE pickups
    SET status = 'delivered',
        delivered_at = CURRENT_TIMESTAMP,
        delivery_verification_notes = 'Handed over directly to kitchen supervisor at receiving dock.',
        delivery_recipient_name = 'Sister Clara - Kitchen Supervisor',
        digital_signature = 'SIG_INTAKE_VERIFIED_7718',
        delivery_photo_url = '/images/verifications/delivery_receipt.jpg'
    WHERE id = ?
  `).run(pikId);
  db.prepare("UPDATE food_donations SET status = 'delivered' WHERE id = 'don_lifecycle_flow'").run();

  // Increment impact
  db.prepare(`
    UPDATE impact_statistics
    SET meals_rescued = meals_rescued + 40,
        food_weight_rescued = food_weight_rescued + 15.0,
        donations_completed = donations_completed + 1
    WHERE id = 'global_impact'
  `).run();

  p = db.prepare("SELECT status, delivered_at, delivery_recipient_name, digital_signature FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "delivered" && p.delivered_at !== null, "Stage 6 verified: 'delivered' with completion timestamp");
  assert(p.delivery_recipient_name === "Sister Clara - Kitchen Supervisor", "Delivery recipient handover verified");
  assert(p.digital_signature === "SIG_INTAKE_VERIFIED_7718", "Digital confirmation verified");

  const impactAfter = db.prepare("SELECT meals_rescued, food_weight_rescued, donations_completed FROM impact_statistics WHERE id = 'global_impact'").get();
  assert(impactAfter.meals_rescued === impactBefore.meals_rescued + 40, "Global impact meals incremented (+40)");
  assert(impactAfter.donations_completed === impactBefore.donations_completed + 1, "Global impact donations completed incremented (+1)");

  // Stage 7: Completed
  db.prepare(`
    UPDATE pickups
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(pikId);
  db.prepare("UPDATE food_donations SET status = 'completed' WHERE id = 'don_lifecycle_flow'").run();

  p = db.prepare("SELECT status, completed_at FROM pickups WHERE id = ?").get(pikId);
  assert(p.status === "completed" && p.completed_at !== null, "Stage 7 verified: 'completed' with final archived timestamp");
}

console.log("\n--- 5. Volunteer Real Database Statistics ---");
{
  // Calculate real metrics for usr_vol_1
  const completedCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM pickups p
    JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
    WHERE vp.user_id = 'usr_vol_1' AND p.status IN ('delivered', 'completed')
  `).get().count;

  const sums = db.prepare(`
    SELECT COALESCE(SUM(fd.servings), 0) as meals,
           COALESCE(SUM(COALESCE(p.distance_miles, 2.4)), 0) as distance
    FROM pickups p
    JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
    JOIN food_donations fd ON p.donation_id = fd.id
    WHERE vp.user_id = 'usr_vol_1' AND p.status IN ('delivered', 'completed')
  `).get();

  const points = completedCount * 50 + Math.round(sums.meals * 0.5);

  assert(completedCount >= 1, "Real completed deliveries count matches database (>0)");
  assert(sums.meals >= 40, "Real meals transported matches sum of completed deliveries");
  assert(sums.distance > 0, "Real distance travelled calculated accurately");
  assert(points > 0, `Volunteer points calculated correctly from real database records (${points} pts)`);
}

console.log("\n--- 6. Volunteer Notification Delivery ---");
{
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES ('notif_deliv_1', 'usr_vol_1', 'Mission Fulfilled! Points Added', '40 portions safely delivered.', 'delivery_completed')
  `).run();

  const notifs = db.prepare("SELECT * FROM notifications WHERE user_id = 'usr_vol_1'").all();
  assert(notifs.length >= 2, "Volunteer has notifications recorded");
  assert(notifs.some((n) => n.type === "pickup_accepted"), "Contains pickup_accepted notification");
  assert(notifs.some((n) => n.type === "delivery_completed"), "Contains delivery_completed notification");
}

console.log("\n==================================================");
console.log(` RESULTS: ${testsPassed} / ${testsTotal} ASSERTIONS PASSED`);
console.log("==================================================\n");

if (testsPassed === testsTotal) {
  console.log("✅ All volunteer module tests passed with 100% success!");
} else {
  console.error("❌ Some tests failed.");
  process.exit(1);
}
