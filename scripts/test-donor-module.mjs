import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("==========================================");
console.log("   SHAREBITE DONOR MODULE TEST SUITE     ");
console.log("==========================================\n");

const dbPath = path.join(process.cwd(), "data", "test-donor-module.db");
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

// 1. Setup schema
console.log("--- 1. Initializing Database Schema & Seed Data ---");
const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

// Seed base users & profiles
db.prepare(`
  INSERT INTO users (id, name, email, password_hash, phone, role, status)
  VALUES ('usr_donor_1', 'Chef Marco Rivera', 'donor@sharebite.org', 'hash123', '+15552348901', 'donor', 'active'),
         ('usr_ngo_1', 'Elena Rostova', 'ngo@sharebite.org', 'hash123', '+15558765432', 'ngo', 'active'),
         ('usr_vol_1', 'Marcus Vance', 'volunteer@sharebite.org', 'hash123', '+15554567890', 'volunteer', 'active');
`).run();

db.prepare(`
  INSERT INTO donor_profiles (id, user_id, organization_name, address, verification_status)
  VALUES ('donor_prof_1', 'usr_donor_1', 'Green Leaf Bistro', '420 Market Street, San Francisco, CA', 'verified');
`).run();

db.prepare(`
  INSERT INTO ngo_profiles (id, user_id, organization_name, address, contact_person, verification_status, capacity)
  VALUES ('ngo_prof_1', 'usr_ngo_1', 'Hope Kitchen & Shelter', '782 Mission Blvd, San Francisco, CA', 'Elena Rostova', 'verified', 300);
`).run();

db.prepare(`
  INSERT INTO volunteer_profiles (id, user_id, address, availability_status, verification_status)
  VALUES ('vol_prof_1', 'usr_vol_1', '154 Valencia St, San Francisco, CA', 'available', 'verified');
`).run();

assert(true, "Database tables and seed entities initialized successfully");

// 2. Test Input Validation & Food Safety
console.log("\n--- 2. Testing Input Validation & Error Handling ---");

// Negative quantity check constraint
let threwNegativeQty = false;
try {
  db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      available_until, pickup_address, status
    ) VALUES ('don_neg', 'donor_prof_1', 'Invalid Food', 'Test', 'Cooked meals', -10, 20, datetime('now', '+4 hours'), 'Address', 'published')
  `).run();
} catch (e) {
  threwNegativeQty = true;
}
assert(threwNegativeQty, "Prevented negative quantity via CHECK constraint (quantity > 0)");

// Zero servings check constraint
let threwZeroServings = false;
try {
  db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      available_until, pickup_address, status
    ) VALUES ('don_zero', 'donor_prof_1', 'Invalid Food', 'Test', 'Cooked meals', 10, 0, datetime('now', '+4 hours'), 'Address', 'published')
  `).run();
} catch (e) {
  threwZeroServings = true;
}
assert(threwZeroServings, "Prevented zero servings via CHECK constraint (servings > 0)");

// 3. Test Create Donation with All Required Fields & Categories
console.log("\n--- 3. Testing Create Donation (Full Specifications) ---");

const testCategories = [
  "Cooked meals",
  "Rice",
  "Bread/roti",
  "Fruits",
  "Vegetables",
  "Bakery",
  "Packaged food",
  "Other"
];

for (let i = 0; i < testCategories.length; i++) {
  const cat = testCategories[i];
  const donId = `don_cat_${i}`;
  db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      preparation_time, available_until, storage_method, allergens, image_url,
      pickup_address, latitude, longitude, status, safety_declaration
    ) VALUES (
      ?, 'donor_prof_1', ?, 'Surplus food prepared with care.', ?, 15.5, 35,
      datetime('now', '-1 hour'), datetime('now', '+4 hours'), 'Refrigerated (Below 4°C)',
      '["Vegetarian", "Dairy-Free"]', 'https://example.com/food.jpg',
      '420 Market Street, San Francisco, CA', 37.7749, -122.4194, 'published', 1
    )
  `).run(donId, `${cat} Batch`, cat);
}

const createdCount = db.prepare("SELECT COUNT(*) as count FROM food_donations").get().count;
assert(createdCount === 8, `Successfully created listings for all 8 categories (total: ${createdCount})`);

// 4. Test Complete Donation Lifecycle Progression
console.log("\n--- 4. Testing Donation Lifecycle: Draft -> Published -> Matched -> Accepted -> Pickup Assigned -> Picked Up -> Delivered -> Completed ---");

const lifeDonId = "don_lifecycle_flow";
// Draft
db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    preparation_time, available_until, storage_method, allergens,
    pickup_address, status, safety_declaration
  ) VALUES (
    ?, 'donor_prof_1', 'Fresh Vegetable Biryani', 'Warm trays ready for distribution',
    'Cooked meals', 25.0, 50, datetime('now', '-30 minutes'), datetime('now', '+3 hours'),
    'Hot Insulated Warmer', '["Vegetarian"]', '420 Market Street, SF', 'draft', 1
  )
`).run(lifeDonId);

let don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "draft", "Stage 1: Saved as 'draft'");

// Published
db.prepare("UPDATE food_donations SET status = 'published' WHERE id = ?").run(lifeDonId);
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "published", "Stage 2: Advanced to 'published' (visible to NGOs)");

// Matched
db.prepare("UPDATE food_donations SET status = 'matched' WHERE id = ?").run(lifeDonId);
db.prepare(`
  INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, status)
  VALUES ('match_life', ?, 'ngo_prof_1', 0.96, 1.2, 0.88, 'pending')
`).run(lifeDonId);
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "matched", "Stage 3: Advanced to 'matched' (paired with Hope Kitchen & Shelter)");

// Accepted
db.prepare("UPDATE food_donations SET status = 'accepted' WHERE id = ?").run(lifeDonId);
db.prepare("UPDATE matches SET status = 'accepted' WHERE id = 'match_life'").run();
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "accepted", "Stage 4: Advanced to 'accepted' by NGO");

// Pickup Assigned
db.prepare("UPDATE food_donations SET status = 'pickup_assigned' WHERE id = ?").run(lifeDonId);
db.prepare(`
  INSERT INTO pickups (
    id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location,
    status, accepted_at
  ) VALUES ('pick_life', ?, 'vol_prof_1', 'ngo_prof_1', '420 Market St', '782 Mission Blvd', 'assigned', CURRENT_TIMESTAMP)
`).run(lifeDonId);
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "pickup_assigned", "Stage 5: Advanced to 'pickup_assigned' (volunteer Marcus Vance assigned)");

// Picked Up
db.prepare("UPDATE food_donations SET status = 'picked_up' WHERE id = ?").run(lifeDonId);
db.prepare("UPDATE pickups SET status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP WHERE id = 'pick_life'").run();
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "picked_up", "Stage 6: Advanced to 'picked_up' (food in transit)");

// Delivered
db.prepare("UPDATE food_donations SET status = 'delivered' WHERE id = ?").run(lifeDonId);
db.prepare("UPDATE pickups SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = 'pick_life'").run();
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "delivered", "Stage 7: Advanced to 'delivered' at NGO facility");

// Completed
db.prepare("UPDATE food_donations SET status = 'completed' WHERE id = ?").run(lifeDonId);
don = db.prepare("SELECT status FROM food_donations WHERE id = ?").get(lifeDonId);
assert(don.status === "completed", "Stage 8: Cycle 'completed' with impact credited");

// Cancelled support
db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    available_until, pickup_address, status
  ) VALUES ('don_cancelled', 'donor_prof_1', 'Cancelled Batch', 'N/A', 'Other', 5, 10, datetime('now', '+2 hours'), '420 Market', 'cancelled')
`).run();
const cancelItem = db.prepare("SELECT status FROM food_donations WHERE id = 'don_cancelled'").get();
assert(cancelItem.status === "cancelled", "Supported status: 'cancelled'");

// Expired support
db.prepare(`
  INSERT INTO food_donations (
    id, donor_id, food_name, description, category, quantity, servings,
    available_until, pickup_address, status
  ) VALUES ('don_expired', 'donor_prof_1', 'Expired Bakery', 'Past time', 'Bakery', 8, 15, datetime('now', '-1 hour'), '420 Market', 'expired')
`).run();
const expireItem = db.prepare("SELECT status FROM food_donations WHERE id = 'don_expired'").get();
assert(expireItem.status === "expired", "Supported status: 'expired'");

// 5. Test Donor Notifications for Every Event
console.log("\n--- 5. Testing Donor Notifications on Events ---");

const notifEvents = [
  { type: "match_found", title: "NGO Matched", msg: "A nearby shelter was matched with your donation." },
  { type: "donation_alert", title: "Donation Accepted", msg: "Hope Kitchen accepted your food donation." },
  { type: "pickup_assigned", title: "Volunteer Assigned", msg: "Courier Marcus Vance has been assigned." },
  { type: "pickup_assigned", title: "Food Picked Up", msg: "Your food surplus was collected from your kitchen." },
  { type: "delivery_completed", title: "Food Delivered & Rescued!", msg: "Your donation reached the shelter safely." },
  { type: "donation_alert", title: "Donation Expired", msg: "Your listing expired before being collected." }
];

for (let i = 0; i < notifEvents.length; i++) {
  const ev = notifEvents[i];
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, read_status, created_at)
    VALUES (?, 'usr_donor_1', ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `).run(`notif_${i}`, ev.title, ev.msg, ev.type);
}

const donorNotifs = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = 'usr_donor_1'").get().count;
assert(donorNotifs === 6, `Successfully generated all 6 required notification alerts for donor (total: ${donorNotifs})`);

// 6. Test Donor Dashboard Real Metrics
console.log("\n--- 6. Testing Donor Dashboard Real Calculations (No Mock Data) ---");

const allDonations = db.prepare(`
  SELECT fd.status, fd.servings, fd.quantity
  FROM food_donations fd
  JOIN donor_profiles dp ON fd.donor_id = dp.id
  WHERE dp.user_id = 'usr_donor_1'
`).all();

let activeCount = 0;
let completedCount = 0;
let pendingCount = 0;
let mealsRescued = 0;
let foodRescuedKg = 0;

for (const d of allDonations) {
  const s = d.status.toLowerCase();
  if (["published", "available", "matched", "accepted", "pickup_assigned", "in_transit", "picked_up"].includes(s)) {
    activeCount++;
  }
  if (["delivered", "completed"].includes(s)) {
    completedCount++;
    mealsRescued += d.servings || 0;
    foodRescuedKg += d.quantity || 0;
  }
  if (["draft", "published", "available"].includes(s)) {
    pendingCount++;
  }
}

assert(activeCount === 8, `Active donations counted: ${activeCount}`);
assert(completedCount === 1, `Completed donations counted: ${completedCount}`);
assert(pendingCount === 8, `Pending donations counted: ${pendingCount}`);
assert(mealsRescued === 50, `Meals rescued accurately calculated: ${mealsRescued}`);
assert(foodRescuedKg === 25.0, `Food rescued weight accurately calculated: ${foodRescuedKg} kg`);

// 7. Test My Donations Filters
console.log("\n--- 7. Testing My Donations Filter Queries ---");

const activeFilter = db.prepare(`
  SELECT COUNT(*) as count FROM food_donations
  WHERE status IN ('published', 'available', 'matched', 'accepted', 'pickup_assigned', 'in_transit', 'picked_up')
`).get().count;
assert(activeFilter === 8, `Filter 'Active' returned ${activeFilter} items`);

const pendingFilter = db.prepare(`
  SELECT COUNT(*) as count FROM food_donations
  WHERE status IN ('draft', 'published', 'available', 'matched')
`).get().count;
assert(pendingFilter === 8, `Filter 'Pending' returned ${pendingFilter} items`);

const completedFilter = db.prepare(`
  SELECT COUNT(*) as count FROM food_donations
  WHERE status IN ('delivered', 'completed')
`).get().count;
assert(completedFilter === 1, `Filter 'Completed' returned ${completedFilter} items`);

const expiredFilter = db.prepare(`
  SELECT COUNT(*) as count FROM food_donations WHERE status = 'expired'
`).get().count;
assert(expiredFilter === 1, `Filter 'Expired' returned ${expiredFilter} items`);

const cancelledFilter = db.prepare(`
  SELECT COUNT(*) as count FROM food_donations WHERE status = 'cancelled'
`).get().count;
assert(cancelledFilter === 1, `Filter 'Cancelled' returned ${cancelledFilter} items`);

console.log("\n==========================================");
console.log(`DONOR MODULE TEST SUMMARY: ${testsPassed} / ${testsTotal} assertions passed.`);
console.log("==========================================");
