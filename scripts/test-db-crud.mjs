import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Ensure test directory
const testDbPath = path.join(process.cwd(), "data", "test-foodrescue.db");
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new Database(testDbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

console.log("==========================================");
console.log("   SHAREBITE DATABASE & CRUD TEST SUITE  ");
console.log("==========================================\n");

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Run Schema DDL
console.log("--- 1. Testing Schema Migration & Table Creation ---");
const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((t) => t.name);

const requiredTables = [
  "users",
  "donor_profiles",
  "ngo_profiles",
  "volunteer_profiles",
  "food_donations",
  "food_requests",
  "matches",
  "pickups",
  "notifications",
  "reviews",
  "impact_statistics",
];

for (const t of requiredTables) {
  assert(tables.includes(t), `Table exists: ${t}`);
}

// 2. Testing Users & Profiles (1-to-1 Relationship)
console.log("\n--- 2. Testing Users & Profiles CRUD & 1-to-1 Relationships ---");
{
  // Insert Users
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("u_donor_1", "Chef Giovanni", "giovanni@trattoria.org", "$2a$10$hash", "+15551230001", "donor", "active");

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("u_ngo_1", "Sister Martha", "martha@shelter.org", "$2a$10$hash", "+15551230002", "ngo", "active");

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("u_vol_1", "Alex Courier", "alex@courier.org", "$2a$10$hash", "+15551230003", "volunteer", "active");

  const donorUser = db.prepare("SELECT * FROM users WHERE email = ?").get("giovanni@trattoria.org");
  assert(donorUser && donorUser.name === "Chef Giovanni", "User inserted and retrieved by email");

  // Insert Profiles
  db.prepare(`
    INSERT INTO donor_profiles (id, user_id, organization_name, address, verification_status)
    VALUES (?, ?, ?, ?, ?)
  `).run("dp_1", "u_donor_1", "Trattoria Pasta House", "120 Main St, SF", "verified");

  db.prepare(`
    INSERT INTO ngo_profiles (id, user_id, organization_name, address, contact_person, verification_status, capacity, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run("np_1", "u_ngo_1", "St. Jude Shelter", "300 4th St, SF", "Sister Martha", "verified", 250, "Nightly hot meal distribution");

  db.prepare(`
    INSERT INTO volunteer_profiles (id, user_id, address, availability_status, verification_status)
    VALUES (?, ?, ?, ?, ?)
  `).run("vp_1", "u_vol_1", "55 Castro St, SF", "available", "verified");

  // Verify Join
  const joinedDonor = db.prepare(`
    SELECT u.name, u.email, dp.organization_name, dp.address
    FROM users u
    JOIN donor_profiles dp ON u.id = dp.user_id
    WHERE u.id = 'u_donor_1'
  `).get();
  assert(joinedDonor.organization_name === "Trattoria Pasta House", "1-to-1 Join: User -> Donor Profile successfully queried");

  // Test Email Unique Constraint
  let duplicateCaught = false;
  try {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("u_dup", "Fake User", "giovanni@trattoria.org", "hash", "123", "donor");
  } catch (err) {
    duplicateCaught = err.message.includes("UNIQUE constraint failed");
  }
  assert(duplicateCaught, "Enforces UNIQUE constraint on users(email)");

  // Test Foreign Key Constraint: Inserting profile with non-existent user_id
  let fkCaught = false;
  try {
    db.prepare(`
      INSERT INTO donor_profiles (id, user_id, address)
      VALUES (?, ?, ?)
    `).run("dp_invalid", "NON_EXISTENT_USER_ID", "123 Fake St");
  } catch (err) {
    fkCaught = err.message.includes("FOREIGN KEY constraint failed");
  }
  assert(fkCaught, "Enforces FOREIGN KEY constraint when creating profile without valid user");
}

// 3. Testing Food Donations (1-to-Many Relationship with Donor Profile)
console.log("\n--- 3. Testing Food Donations CRUD ---");
{
  db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      available_until, pickup_address, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "don_01",
    "dp_1",
    "Gourmet Lasagna Trays",
    "Freshly prepared baked beef and veggie lasagna",
    "Cooked Meals",
    25.0,
    50,
    "2026-10-26T22:00:00Z",
    "120 Main St, SF",
    "available"
  );

  const donation = db.prepare("SELECT * FROM food_donations WHERE id = ?").get("don_01");
  assert(donation.food_name === "Gourmet Lasagna Trays" && donation.servings === 50, "Food donation created with portions & quantity");

  // Update Status
  db.prepare("UPDATE food_donations SET status = 'matched' WHERE id = 'don_01'").run();
  const updatedDonation = db.prepare("SELECT status FROM food_donations WHERE id = 'don_01'").get();
  assert(updatedDonation.status === "matched", "Food donation status updated to 'matched'");

  // Check CHECK constraint on negative quantity
  let checkCaught = false;
  try {
    db.prepare(`
      INSERT INTO food_donations (id, donor_id, food_name, category, quantity, servings, available_until, pickup_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("don_neg", "dp_1", "Bad Item", "Cooked Meals", -5.0, 10, "2026-10-26", "Addr");
  } catch (err) {
    checkCaught = err.message.includes("CHECK constraint failed");
  }
  assert(checkCaught, "Enforces CHECK constraint preventing negative donation quantities");
}

// 4. Testing Food Requests & Matches
console.log("\n--- 4. Testing Food Requests & Matching ---");
{
  // Food Request
  db.prepare(`
    INSERT INTO food_requests (id, ngo_id, donation_id, requested_quantity, status)
    VALUES (?, ?, ?, ?, ?)
  `).run("req_01", "np_1", "don_01", 50, "approved");

  const request = db.prepare("SELECT * FROM food_requests WHERE id = 'req_01'").get();
  assert(request.requested_quantity === 50 && request.status === "approved", "Food request created linked to NGO and Donation");

  // Match
  db.prepare(`
    INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("mat_01", "don_01", "np_1", 98.2, 1.8, 90.0, "accepted");

  const match = db.prepare("SELECT * FROM matches WHERE id = 'mat_01'").get();
  assert(match.match_score === 98.2 && match.status === "accepted", "Match record created with scoring algorithm values");
}

// 5. Testing Pickups (Volunteer Logistics & Multi-way Relationship)
console.log("\n--- 5. Testing Pickups & Courier Handover ---");
{
  db.prepare(`
    INSERT INTO pickups (
      id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("pik_01", "don_01", "vp_1", "np_1", "120 Main St, SF", "300 4th St, SF", "assigned");

  const pickup = db.prepare(`
    SELECT p.*,
           fd.food_name,
           dp.organization_name as donor_name,
           np.organization_name as ngo_name,
           u.name as volunteer_name
    FROM pickups p
    JOIN food_donations fd ON p.donation_id = fd.id
    JOIN donor_profiles dp ON fd.donor_id = dp.id
    JOIN ngo_profiles np ON p.ngo_id = np.id
    JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
    JOIN users u ON vp.user_id = u.id
    WHERE p.id = 'pik_01'
  `).get();

  assert(
    pickup.donor_name === "Trattoria Pasta House" &&
    pickup.ngo_name === "St. Jude Shelter" &&
    pickup.volunteer_name === "Alex Courier",
    "Relational Multi-way Join: Donation + Donor + Volunteer + NGO queried seamlessly"
  );

  // Status transitions
  db.prepare("UPDATE pickups SET status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP WHERE id = 'pik_01'").run();
  const pickedUp = db.prepare("SELECT status, picked_up_at FROM pickups WHERE id = 'pik_01'").get();
  assert(pickedUp.status === "picked_up" && pickedUp.picked_up_at !== null, "Pickup updated to 'picked_up' with timestamp");

  db.prepare("UPDATE pickups SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = 'pik_01'").run();
  const delivered = db.prepare("SELECT status, delivered_at FROM pickups WHERE id = 'pik_01'").get();
  assert(delivered.status === "delivered" && delivered.delivered_at !== null, "Pickup updated to 'delivered' with completion timestamp");
}

// 6. Testing Notifications
console.log("\n--- 6. Testing Notifications Table ---");
{
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, read_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run("notif_01", "u_donor_1", "Pickup Scheduled", "Courier Alex is on the way", "pickup_assigned", 0);

  const unreadCount = db.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = 'u_donor_1' AND read_status = 0").get();
  assert(unreadCount.cnt === 1, "Unread notification query via index");

  db.prepare("UPDATE notifications SET read_status = 1 WHERE id = 'notif_01'").run();
  const readCount = db.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = 'u_donor_1' AND read_status = 1").get();
  assert(readCount.cnt === 1, "Notification marked as read (read_status = 1)");
}

// 7. Testing Reviews & Rating Constraint
console.log("\n--- 7. Testing Reviews Table & Ratings Constraint ---");
{
  db.prepare(`
    INSERT INTO reviews (id, reviewer_id, reviewed_user_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run("rev_01", "u_ngo_1", "u_donor_1", 5, "Remarkable food quality and packaging!");

  db.prepare(`
    INSERT INTO reviews (id, reviewer_id, reviewed_user_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run("rev_02", "u_vol_1", "u_donor_1", 4, "Clear pickup instructions, easy parking.");

  const avgReview = db.prepare("SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE reviewed_user_id = 'u_donor_1'").get();
  assert(avgReview.avg === 4.5 && avgReview.cnt === 2, "Reviews aggregated: average rating 4.5 stars over 2 reviews");

  // Test rating constraint (must be 1-5)
  let ratingOutOfRange = false;
  try {
    db.prepare(`
      INSERT INTO reviews (id, reviewer_id, reviewed_user_id, rating)
      VALUES (?, ?, ?, ?)
    `).run("rev_invalid", "u_ngo_1", "u_donor_1", 7);
  } catch (err) {
    ratingOutOfRange = err.message.includes("CHECK constraint failed");
  }
  assert(ratingOutOfRange, "Enforces CHECK constraint on reviews(rating) between 1 and 5");
}

// 8. Testing Impact Statistics
console.log("\n--- 8. Testing Impact Statistics ---");
{
  db.prepare(`
    INSERT INTO impact_statistics (id, meals_rescued, food_weight_rescued, donations_completed, volunteers_involved, organizations_involved)
    VALUES ('global_impact', 1000, 450.5, 80, 25, 12)
  `).run();

  db.prepare(`
    UPDATE impact_statistics
    SET meals_rescued = meals_rescued + 50,
        food_weight_rescued = food_weight_rescued + 25.0,
        donations_completed = donations_completed + 1
    WHERE id = 'global_impact'
  `).run();

  const impact = db.prepare("SELECT * FROM impact_statistics WHERE id = 'global_impact'").get();
  assert(
    impact.meals_rescued === 1050 &&
    impact.food_weight_rescued === 475.5 &&
    impact.donations_completed === 81,
    "Impact statistics correctly tracked and updated"
  );
}

// 9. Cascade Delete Test
console.log("\n--- 9. Testing Referential Integrity & CASCADE Deletes ---");
{
  // Deleting user 'u_vol_1' should cascade delete 'vp_1'
  db.prepare("DELETE FROM users WHERE id = 'u_vol_1'").run();
  const deletedProfile = db.prepare("SELECT * FROM volunteer_profiles WHERE id = 'vp_1'").get();
  assert(deletedProfile === undefined, "CASCADE DELETE: Deleting user automatically deletes associated profile");

  // Pickups where volunteer_id was 'vp_1' should have volunteer_id set to NULL (ON DELETE SET NULL)
  const pickupAfterCascade = db.prepare("SELECT volunteer_id FROM pickups WHERE id = 'pik_01'").get();
  assert(pickupAfterCascade.volunteer_id === null, "ON DELETE SET NULL: Pickup gracefully unbinds volunteer without breaking database integrity");
}

console.log("\n==========================================");
console.log(`DATABASE TEST SUMMARY: ${testsPassed} / ${testsTotal} assertions passed.`);
console.log("==========================================");

db.close();
fs.unlinkSync(testDbPath);
process.exit(testsPassed === testsTotal ? 0 : 1);
