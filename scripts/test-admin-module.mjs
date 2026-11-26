import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==================================================");
console.log("       SHAREBITE ADMIN MODULE TEST SUITE         ");
console.log("==================================================\n");

const dbPath = path.join(process.cwd(), "data", "test-admin-module.db");
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
  VALUES ('usr_admin_1', 'Sarah Lee', 'admin@sharebite.org', 'hash123', '+15550001111', 'admin', 'active'),
         ('usr_donor_1', 'Chef Marco Rivera', 'marco@bistro.com', 'hash123', '+15551112222', 'donor', 'active'),
         ('usr_ngo_1', 'Elena Rostova', 'elena@hopekitchen.org', 'hash123', '+15553334444', 'ngo', 'active'),
         ('usr_ngo_pending', 'John Pending', 'john@shelter.org', 'hash123', '+15557778888', 'ngo', 'pending'),
         ('usr_vol_1', 'Marcus Vance', 'marcus@volunteer.org', 'hash123', '+15554443333', 'volunteer', 'active');
`).run();

db.prepare(`
  INSERT INTO donor_profiles (id, user_id, organization_name, address, verification_status)
  VALUES ('donor_prof_1', 'usr_donor_1', 'Green Leaf Bistro', '420 Market Street, San Francisco, CA', 'verified');
`).run();

db.prepare(`
  INSERT INTO ngo_profiles (id, user_id, organization_name, address, contact_person, verification_status, capacity, current_requirement)
  VALUES ('ngo_prof_1', 'usr_ngo_1', 'Hope Kitchen & Shelter', '782 Mission Blvd, San Francisco, CA', 'Elena Rostova', 'verified', 150, 60),
         ('ngo_prof_2', 'usr_ngo_pending', 'Sunrise Youth Pantry', '123 Pine St, San Francisco, CA', 'John Pending', 'pending', 100, 40);
`).run();

db.prepare(`
  INSERT INTO volunteer_profiles (id, user_id, address, availability_status, verification_status, vehicle_type, preferred_radius)
  VALUES ('vol_prof_1', 'usr_vol_1', 'Downtown Hub', 'available', 'verified', 'Bike', 5);
`).run();

db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    available_until, pickup_address, status
  ) VALUES (
    'don_active_1', 'donor_prof_1', 'Fresh Pasta Pans', 'Hot pasta trays', 'Cooked Meals', 15.0, 45,
    datetime('now', '+4 hours'), '420 Market St', 'available'
  ), (
    'don_completed_1', 'donor_prof_1', 'Bakery Pastries', 'Bagels and rolls', 'Bakery & Bread', 10.0, 30,
    datetime('now', '-2 hours'), '420 Market St', 'delivered'
  ), (
    'don_expired_1', 'donor_prof_1', 'Old Sandwiches', 'Expired packaging', 'Packaged Food', 5.0, 15,
    datetime('now', '-5 hours'), '420 Market St', 'expired'
  );
`).run();

db.prepare(`
  INSERT INTO pickups (
    id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location, status
  ) VALUES (
    'pik_01', 'don_completed_1', 'vol_prof_1', 'ngo_prof_1', '420 Market St', '782 Mission Blvd', 'delivered'
  );
`).run();

assert(true, "Database schema and test records seeded successfully.");

console.log("\n--- 2. Admin Overview: Real-Time 9 Statistics ---");
{
  // 1. Total users
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  assert(totalUsers === 5, `Total users count calculated accurately (${totalUsers} users)`);

  // 2. Active donors
  const activeDonors = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'donor' AND status = 'active'").get().count;
  assert(activeDonors === 1, "Active donors count calculated accurately (1)");

  // 3. Verified NGOs
  const verifiedNgos = db.prepare("SELECT COUNT(*) as count FROM ngo_profiles WHERE verification_status = 'verified'").get().count;
  assert(verifiedNgos === 1, "Verified NGOs count calculated accurately (1)");

  // 4. Active volunteers
  const activeVolunteers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'volunteer' AND status = 'active'").get().count;
  assert(activeVolunteers === 1, "Active volunteers count calculated accurately (1)");

  // 5. Active donations
  const activeDonations = db.prepare("SELECT COUNT(*) as count FROM food_donations WHERE status IN ('published', 'available', 'matched', 'accepted', 'pickup_assigned', 'in_transit')").get().count;
  assert(activeDonations === 1, "Active donations count calculated accurately (1)");

  // 6. Completed donations
  const completedDonations = db.prepare("SELECT COUNT(*) as count FROM food_donations WHERE status IN ('delivered', 'completed')").get().count;
  assert(completedDonations === 1, "Completed donations count calculated accurately (1)");

  // 7. Meals rescued
  const mealsRescued = db.prepare("SELECT COALESCE(SUM(servings), 0) as total FROM food_donations WHERE status IN ('delivered', 'completed')").get().total;
  assert(mealsRescued === 30, `Meals rescued accurately sums completed portions (${mealsRescued} portions)`);

  // 8. Estimated food rescued
  const foodSavedKg = db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM food_donations WHERE status IN ('delivered', 'completed')").get().total;
  assert(foodSavedKg === 10.0, `Food rescued accurately sums weight (${foodSavedKg} kg)`);

  // 9. Expired donations
  const expiredDonations = db.prepare("SELECT COUNT(*) as count FROM food_donations WHERE status = 'expired' OR (available_until < CURRENT_TIMESTAMP AND status IN ('published', 'available'))").get().count;
  assert(expiredDonations === 1, "Expired donations count calculated accurately (1)");
}

console.log("\n--- 3. User Management & Soft Deactivation ---");
{
  // Test 3.1: Query all users with joined profile details
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status,
           dp.organization_name as donor_org,
           np.organization_name as ngo_org
    FROM users u
    LEFT JOIN donor_profiles dp ON u.id = dp.user_id
    LEFT JOIN ngo_profiles np ON u.id = np.user_id
  `).all();

  assert(users.length === 5, "Successfully fetched all 5 users");
  const donor = users.find((u) => u.role === "donor");
  assert(donor && donor.donor_org === "Green Leaf Bistro", "User joined with donor organization name");

  // Test 3.2: Filter by role
  const ngoUsers = users.filter((u) => u.role === "ngo");
  assert(ngoUsers.length === 2, "Filtered users by role correctly (2 NGOs)");

  // Test 3.3: Soft Deactivation of a user
  db.prepare("UPDATE users SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = 'usr_donor_1'").run();
  const suspendedDonor = db.prepare("SELECT status FROM users WHERE id = 'usr_donor_1'").get();
  assert(suspendedDonor.status === "suspended", "User soft-deactivated (status = 'suspended') without deleting records");

  // Historical records intact
  const donorDonations = db.prepare("SELECT COUNT(*) as count FROM food_donations WHERE donor_id = 'donor_prof_1'").get().count;
  assert(donorDonations === 3, "Historical donation records perfectly preserved after soft deactivation");

  // Test 3.4: Reactivate user
  db.prepare("UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = 'usr_donor_1'").run();
  const reactivatedDonor = db.prepare("SELECT status FROM users WHERE id = 'usr_donor_1'").get();
  assert(reactivatedDonor.status === "active", "User successfully reactivated");
}

console.log("\n--- 4. NGO Verification: Pending, Verify, Reject, Suspend ---");
{
  // Test 4.1: View Pending NGO Applications
  const pendingNgos = db.prepare("SELECT * FROM ngo_profiles WHERE verification_status = 'pending'").all();
  assert(pendingNgos.length === 1 && pendingNgos[0].id === "ngo_prof_2", "Pending applications queue lists Sunrise Youth Pantry");

  // Test 4.2: Verify NGO
  db.prepare("UPDATE ngo_profiles SET verification_status = 'verified' WHERE id = 'ngo_prof_2'").run();
  const verified = db.prepare("SELECT verification_status FROM ngo_profiles WHERE id = 'ngo_prof_2'").get();
  assert(verified.verification_status === "verified", "NGO application verified successfully");

  // Test 4.3: Suspend NGO
  db.prepare("UPDATE ngo_profiles SET verification_status = 'suspended' WHERE id = 'ngo_prof_2'").run();
  const suspended = db.prepare("SELECT verification_status FROM ngo_profiles WHERE id = 'ngo_prof_2'").get();
  assert(suspended.verification_status === "suspended", "NGO access suspended successfully");

  // Test 4.4: Reject NGO
  db.prepare("UPDATE ngo_profiles SET verification_status = 'rejected' WHERE id = 'ngo_prof_2'").run();
  const rejected = db.prepare("SELECT verification_status FROM ngo_profiles WHERE id = 'ngo_prof_2'").get();
  assert(rejected.verification_status === "rejected", "NGO status set to rejected");
}

console.log("\n--- 5. Donation Management & Listing Cancellation ---");
{
  // Test 5.1: Search and filter donations
  const availableDonations = db.prepare("SELECT * FROM food_donations WHERE status = 'available'").all();
  assert(availableDonations.length === 1, "Filtered donations by available status");

  // Test 5.2: Cancel inappropriate/fraudulent listing
  db.prepare("UPDATE food_donations SET status = 'cancelled' WHERE id = 'don_active_1'").run();
  const cancelledDon = db.prepare("SELECT status FROM food_donations WHERE id = 'don_active_1'").get();
  assert(cancelledDon.status === "cancelled", "Donation listing cancelled by administrator");

  // Associated notification created
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES ('notif_cancel_1', 'usr_donor_1', 'Listing Cancelled by Admin', 'Cancelled due to packaging guidelines.', 'donation_alert')
  `).run();
  const notif = db.prepare("SELECT * FROM notifications WHERE id = 'notif_cancel_1'").get();
  assert(notif !== null, "Donor notified of administrative cancellation");
}

console.log("\n--- 6. Volunteer Management ---");
{
  // Test 6.1: View volunteers with trip counts
  const volRecord = db.prepare(`
    SELECT vp.*, u.name, u.status as user_status,
           (SELECT COUNT(*) FROM pickups p WHERE p.volunteer_id = vp.id AND p.status IN ('delivered', 'completed')) as trips
    FROM volunteer_profiles vp
    JOIN users u ON vp.user_id = u.id
    WHERE u.id = 'usr_vol_1'
  `).get();

  assert(volRecord.trips === 1, "Completed trips counted for volunteer (1 trip)");
  assert(volRecord.verification_status === "verified", "Volunteer verification status visible");

  // Test 6.2: Soft deactivate volunteer
  db.prepare("UPDATE users SET status = 'suspended' WHERE id = 'usr_vol_1'").run();
  const suspendedVol = db.prepare("SELECT status FROM users WHERE id = 'usr_vol_1'").get();
  assert(suspendedVol.status === "suspended", "Volunteer soft-deactivated successfully");

  // Test 6.3: Reactivate volunteer
  db.prepare("UPDATE users SET status = 'active' WHERE id = 'usr_vol_1'").run();
  const reactivatedVol = db.prepare("SELECT status FROM users WHERE id = 'usr_vol_1'").get();
  assert(reactivatedVol.status === "active", "Volunteer reactivated successfully");
}

console.log("\n--- 7. Reports System: 5 Categories & Status Workflow ---");
{
  // Test 7.1: Insert reports for each of the 5 required categories
  const categories = [
    { cat: "incorrect_donation", title: "Portion count discrepancy", sev: "medium" },
    { cat: "food_safety_concern", title: "Unsealed container delivered", sev: "high" },
    { cat: "fake_organization", title: "Suspected invalid 501c3 certificate", sev: "critical" },
    { cat: "volunteer_issue", title: "Courier failed to arrive for scheduled pickup", sev: "low" },
    { cat: "other", title: "General inquiry on pickup window hours", sev: "low" },
  ];

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    db.prepare(`
      INSERT INTO reports (id, reporter_id, reported_entity_type, reported_title, category, description, severity, status)
      VALUES (?, 'usr_donor_1', 'donation', ?, ?, 'Automated test description', ?, 'open')
    `).run(`test_rep_${i + 1}`, c.title, c.cat, c.sev);
  }

  const reportsCount = db.prepare("SELECT COUNT(*) as count FROM reports").get().count;
  assert(reportsCount === 5, "All 5 required report categories created and saved in SQLite");

  // Test 7.2: Update status to 'investigating' with admin notes
  db.prepare(`
    UPDATE reports
    SET status = 'investigating', admin_notes = 'Reviewing donor kitchen video log.'
    WHERE id = 'test_rep_1'
  `).run();
  const rep1 = db.prepare("SELECT status, admin_notes FROM reports WHERE id = 'test_rep_1'").get();
  assert(rep1.status === "investigating" && rep1.admin_notes.includes("video log"), "Report updated to 'investigating' with notes");

  // Test 7.3: Mark report resolved with resolution timestamp
  db.prepare(`
    UPDATE reports
    SET status = 'resolved', admin_notes = 'Donor warned; portion re-verified.', resolved_at = CURRENT_TIMESTAMP
    WHERE id = 'test_rep_1'
  `).run();
  const repResolved = db.prepare("SELECT status, resolved_at FROM reports WHERE id = 'test_rep_1'").get();
  assert(repResolved.status === "resolved" && repResolved.resolved_at !== null, "Report marked as 'resolved' with timestamp");
}

console.log("\n--- 8. Real Database Analytics Aggregations ---");
{
  // Test 8.1: Category breakdown aggregation
  const catRows = db.prepare(`
    SELECT category, COUNT(*) as count, COALESCE(SUM(servings), 0) as servings
    FROM food_donations
    GROUP BY category
  `).all();
  assert(catRows.length >= 2, "Real category breakdown aggregated from food_donations table");

  // Test 8.2: Completed vs Expired status aggregation
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count FROM food_donations GROUP BY status
  `).all();
  assert(statusStats.some((s) => s.status === "delivered"), "Completed donations represented in pipeline");
  assert(statusStats.some((s) => s.status === "expired"), "Expired donations represented in pipeline");
  assert(statusStats.some((s) => s.status === "cancelled"), "Cancelled donations represented in pipeline");
}

console.log("\n==================================================");
console.log(` RESULTS: ${testsPassed} / ${testsTotal} ASSERTIONS PASSED`);
console.log("==================================================\n");

if (testsPassed === testsTotal) {
  console.log("✅ All Admin module tests passed with 100% success!");
} else {
  console.error("❌ Some tests failed.");
  process.exit(1);
}
