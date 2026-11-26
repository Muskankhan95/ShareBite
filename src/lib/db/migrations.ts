import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export function runMigrations(db: Database.Database) {
  // 1. Read and execute Schema DDL
  const schemaPath = path.join(__dirname, "schema.sql");
  let schemaSql = "";
  try {
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, "utf-8");
    }
  } catch {
    // Fallback if bundled path differs
  }

  if (!schemaSql) {
    // Embedded DDL fallback
    schemaSql = `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('donor', 'ngo', 'volunteer', 'admin')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS donor_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        organization_name TEXT,
        address TEXT NOT NULL,
        verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ngo_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        organization_name TEXT NOT NULL,
        address TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('verified', 'pending', 'rejected', 'suspended')),
        capacity INTEGER NOT NULL DEFAULT 100 CHECK(capacity >= 0),
        current_requirement INTEGER NOT NULL DEFAULT 50 CHECK(current_requirement >= 0),
        preferred_categories TEXT DEFAULT '["Cooked meals", "Rice", "Bread/roti"]',
        registration_number TEXT DEFAULT 'NGO-501C3-88204',
        operational_hours TEXT DEFAULT '7:00 AM - 9:00 PM',
        description TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS volunteer_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        availability_status TEXT NOT NULL DEFAULT 'available' CHECK(availability_status IN ('available', 'unavailable', 'busy', 'offline')),
        verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected')),
        vehicle_type TEXT DEFAULT 'Bike',
        preferred_radius INTEGER DEFAULT 5,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS food_donations (
        id TEXT PRIMARY KEY,
        donor_id TEXT NOT NULL,
        food_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        servings INTEGER NOT NULL CHECK(servings > 0),
        preparation_time DATETIME,
        available_until DATETIME NOT NULL,
        storage_method TEXT,
        allergens TEXT,
        image_url TEXT,
        pickup_address TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'available', 'requested', 'matched', 'accepted', 'pickup_assigned', 'in_transit', 'picked_up', 'delivered', 'completed', 'cancelled', 'expired')),
        safety_declaration INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES donor_profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS food_requests (
        id TEXT PRIMARY KEY,
        ngo_id TEXT NOT NULL,
        donation_id TEXT,
        requested_quantity INTEGER NOT NULL CHECK(requested_quantity > 0),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'fulfilled', 'rejected', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        donation_id TEXT NOT NULL,
        ngo_id TEXT NOT NULL,
        match_score REAL NOT NULL DEFAULT 0.0,
        distance REAL NOT NULL DEFAULT 0.0,
        urgency_score REAL NOT NULL DEFAULT 0.0,
        reasons TEXT,
        factors_json TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'expired')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
        FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pickups (
        id TEXT PRIMARY KEY,
        donation_id TEXT NOT NULL,
        volunteer_id TEXT,
        ngo_id TEXT NOT NULL,
        pickup_location TEXT NOT NULL,
        delivery_location TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'pending', 'accepted', 'assigned', 'at_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'failed')),
        accepted_at DATETIME,
        at_pickup_at DATETIME,
        picked_up_at DATETIME,
        in_transit_at DATETIME,
        delivered_at DATETIME,
        completed_at DATETIME,
        distance_miles REAL DEFAULT 2.4,
        estimated_duration_mins INTEGER DEFAULT 18,
        pickup_verification_notes TEXT,
        pickup_temp_c REAL,
        pickup_photo_url TEXT,
        delivery_verification_notes TEXT,
        delivery_recipient_name TEXT,
        delivery_photo_url TEXT,
        digital_signature TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES volunteer_profiles(id) ON DELETE SET NULL,
        FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('donation_alert', 'match_found', 'pickup_assigned', 'pickup_accepted', 'pickup_status_changed', 'pickup_cancelled', 'delivery_completed', 'verification_update', 'general')),
        read_status INTEGER NOT NULL DEFAULT 0 CHECK(read_status IN (0, 1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        reviewer_id TEXT NOT NULL,
        reviewed_user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS impact_statistics (
        id TEXT PRIMARY KEY DEFAULT 'global_impact',
        meals_rescued INTEGER NOT NULL DEFAULT 0,
        food_weight_rescued REAL NOT NULL DEFAULT 0.0,
        donations_completed INTEGER NOT NULL DEFAULT 0,
        volunteers_involved INTEGER NOT NULL DEFAULT 0,
        organizations_involved INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        reported_entity_type TEXT NOT NULL CHECK(reported_entity_type IN ('donation', 'ngo', 'donor', 'volunteer', 'other')),
        reported_entity_id TEXT,
        reported_title TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('incorrect_donation', 'food_safety_concern', 'fake_organization', 'volunteer_issue', 'other')),
        description TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')),
        admin_notes TEXT,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_food_donations_donor ON food_donations(donor_id);
      CREATE INDEX IF NOT EXISTS idx_food_donations_status ON food_donations(status);
      CREATE INDEX IF NOT EXISTS idx_pickups_donation ON pickups(donation_id);
      CREATE INDEX IF NOT EXISTS idx_pickups_volunteer ON pickups(volunteer_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
    `;
  }

  db.exec(schemaSql);

  // Upgrade food_donations table if created with previous constraint
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'food_donations'").get() as any;
    if (tableSql && !tableSql.sql.includes("'draft'")) {
      db.pragma("foreign_keys = OFF");
      db.exec(`
        CREATE TABLE IF NOT EXISTS food_donations_temp (
          id TEXT PRIMARY KEY,
          donor_id TEXT NOT NULL,
          food_name TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          quantity REAL NOT NULL CHECK(quantity > 0),
          servings INTEGER NOT NULL CHECK(servings > 0),
          preparation_time DATETIME,
          available_until DATETIME NOT NULL,
          storage_method TEXT,
          allergens TEXT,
          image_url TEXT,
          pickup_address TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'available', 'requested', 'matched', 'accepted', 'pickup_assigned', 'in_transit', 'picked_up', 'delivered', 'completed', 'cancelled', 'expired')),
          safety_declaration INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (donor_id) REFERENCES donor_profiles(id) ON DELETE CASCADE
        );
        INSERT OR IGNORE INTO food_donations_temp (id, donor_id, food_name, description, category, quantity, servings, preparation_time, available_until, storage_method, allergens, image_url, pickup_address, latitude, longitude, status, created_at)
        SELECT id, donor_id, food_name, description, category, quantity, servings, preparation_time, available_until, storage_method, allergens, image_url, pickup_address, latitude, longitude, status, created_at FROM food_donations;
        DROP TABLE food_donations;
        ALTER TABLE food_donations_temp RENAME TO food_donations;
        CREATE INDEX IF NOT EXISTS idx_food_donations_donor ON food_donations(donor_id);
        CREATE INDEX IF NOT EXISTS idx_food_donations_status ON food_donations(status);
        CREATE INDEX IF NOT EXISTS idx_food_donations_available_until ON food_donations(available_until);
      `);
      db.pragma("foreign_keys = ON");
    }
  } catch (err) {
    console.error("Migration upgrade check error:", err);
  }

  // Upgrade ngo_profiles table if created with previous constraint or missing capacity columns
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'ngo_profiles'").get() as any;
    if (tableSql && (!tableSql.sql.includes("'suspended'") || !tableSql.sql.includes("current_requirement"))) {
      db.pragma("foreign_keys = OFF");
      db.exec(`
        CREATE TABLE IF NOT EXISTS ngo_profiles_temp (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          organization_name TEXT NOT NULL,
          address TEXT NOT NULL,
          contact_person TEXT NOT NULL,
          verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('verified', 'pending', 'rejected', 'suspended')),
          capacity INTEGER NOT NULL DEFAULT 100 CHECK(capacity >= 0),
          current_requirement INTEGER NOT NULL DEFAULT 50 CHECK(current_requirement >= 0),
          preferred_categories TEXT DEFAULT '["Cooked meals", "Rice", "Bread/roti"]',
          registration_number TEXT DEFAULT 'NGO-501C3-88204',
          operational_hours TEXT DEFAULT '7:00 AM - 9:00 PM',
          description TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT OR IGNORE INTO ngo_profiles_temp (id, user_id, organization_name, address, contact_person, verification_status, capacity, description)
        SELECT id, user_id, organization_name, address, contact_person, verification_status, capacity, description FROM ngo_profiles;
        DROP TABLE ngo_profiles;
        ALTER TABLE ngo_profiles_temp RENAME TO ngo_profiles;
        CREATE INDEX IF NOT EXISTS idx_ngo_profiles_user ON ngo_profiles(user_id);
      `);
      db.pragma("foreign_keys = ON");
    }
  } catch (err) {
    console.error("NGO migration upgrade error:", err);
  }

  // Upgrade volunteer_profiles table if missing 'unavailable' or vehicle_type
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'volunteer_profiles'").get() as any;
    if (tableSql && (!tableSql.sql.includes("'unavailable'") || !tableSql.sql.includes("vehicle_type"))) {
      db.pragma("foreign_keys = OFF");
      db.exec(`
        CREATE TABLE IF NOT EXISTS volunteer_profiles_temp (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          address TEXT NOT NULL,
          availability_status TEXT NOT NULL DEFAULT 'available' CHECK(availability_status IN ('available', 'unavailable', 'busy', 'offline')),
          verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected')),
          vehicle_type TEXT DEFAULT 'Bike',
          preferred_radius INTEGER DEFAULT 5,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT OR IGNORE INTO volunteer_profiles_temp (id, user_id, address, availability_status, verification_status)
        SELECT id, user_id, address, availability_status, verification_status FROM volunteer_profiles;
        DROP TABLE volunteer_profiles;
        ALTER TABLE volunteer_profiles_temp RENAME TO volunteer_profiles;
        CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_user ON volunteer_profiles(user_id);
      `);
      db.pragma("foreign_keys = ON");
    }
  } catch (err) {
    console.error("Volunteer profile migration upgrade error:", err);
  }

  // Upgrade pickups table to full lifecycle statuses and verification columns
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'pickups'").get() as any;
    if (tableSql && (!tableSql.sql.includes("'at_pickup'") || !tableSql.sql.includes("pickup_verification_notes"))) {
      db.pragma("foreign_keys = OFF");
      db.exec(`
        CREATE TABLE IF NOT EXISTS pickups_temp (
          id TEXT PRIMARY KEY,
          donation_id TEXT NOT NULL,
          volunteer_id TEXT,
          ngo_id TEXT NOT NULL,
          pickup_location TEXT NOT NULL,
          delivery_location TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'pending', 'accepted', 'assigned', 'at_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'failed')),
          accepted_at DATETIME,
          at_pickup_at DATETIME,
          picked_up_at DATETIME,
          in_transit_at DATETIME,
          delivered_at DATETIME,
          completed_at DATETIME,
          distance_miles REAL DEFAULT 2.4,
          estimated_duration_mins INTEGER DEFAULT 18,
          pickup_verification_notes TEXT,
          pickup_temp_c REAL,
          pickup_photo_url TEXT,
          delivery_verification_notes TEXT,
          delivery_recipient_name TEXT,
          delivery_photo_url TEXT,
          digital_signature TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
          FOREIGN KEY (volunteer_id) REFERENCES volunteer_profiles(id) ON DELETE SET NULL,
          FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(id) ON DELETE CASCADE
        );
        INSERT OR IGNORE INTO pickups_temp (id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location, status, accepted_at, picked_up_at, delivered_at)
        SELECT id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location, status, accepted_at, picked_up_at, delivered_at FROM pickups;
        DROP TABLE pickups;
        ALTER TABLE pickups_temp RENAME TO pickups;
        CREATE INDEX IF NOT EXISTS idx_pickups_donation ON pickups(donation_id);
        CREATE INDEX IF NOT EXISTS idx_pickups_volunteer ON pickups(volunteer_id);
        CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);
      `);
      db.pragma("foreign_keys = ON");
    }
  } catch (err) {
    console.error("Pickups migration upgrade error:", err);
  }

  // Upgrade notifications table to include new notification types
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'notifications'").get() as any;
    if (tableSql && !tableSql.sql.includes("'pickup_accepted'")) {
      db.pragma("foreign_keys = OFF");
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications_temp (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('donation_alert', 'match_found', 'pickup_assigned', 'pickup_accepted', 'pickup_status_changed', 'pickup_cancelled', 'delivery_completed', 'verification_update', 'general')),
          read_status INTEGER NOT NULL DEFAULT 0 CHECK(read_status IN (0, 1)),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT OR IGNORE INTO notifications_temp (id, user_id, title, message, type, read_status, created_at)
        SELECT id, user_id, title, message, type, read_status, created_at FROM notifications;
        DROP TABLE notifications;
        ALTER TABLE notifications_temp RENAME TO notifications;
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      `);
      db.pragma("foreign_keys = ON");
    }
  } catch (err) {
    console.error("Notifications migration upgrade error:", err);
  }

  // Ensure reports table exists and seed sample reports if empty
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        reported_entity_type TEXT NOT NULL CHECK(reported_entity_type IN ('donation', 'ngo', 'donor', 'volunteer', 'other')),
        reported_entity_id TEXT,
        reported_title TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('incorrect_donation', 'food_safety_concern', 'fake_organization', 'volunteer_issue', 'other')),
        description TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')),
        admin_notes TEXT,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
    `);

    const reportCount = db.prepare("SELECT COUNT(*) as count FROM reports").get() as any;
    if (reportCount && reportCount.count === 0 && process.env.NODE_ENV !== "production") {
      const insertReport = db.prepare(`
        INSERT INTO reports (id, reporter_id, reported_entity_type, reported_entity_id, reported_title, category, description, severity, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertReport.run(
        "rep_01",
        "usr_vol_1",
        "donation",
        "don_102",
        "Incorrect portion count reported",
        "incorrect_donation",
        "Donor listed 70 portions of pastries but actual packaging contained only ~35 items upon arrival.",
        "medium",
        "investigating",
        new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      );
      insertReport.run(
        "rep_02",
        "usr_ngo_1",
        "donation",
        "don_101",
        "Missing temperature documentation on cooked pasta",
        "food_safety_concern",
        "Container seal was intact but reheating and preparation time sticker was smudged.",
        "high",
        "open",
        new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      );
      insertReport.run(
        "rep_03",
        "usr_donor_1",
        "ngo",
        "ngo_prof_1",
        "Suspicious registration document duplicate",
        "fake_organization",
        "Inquiry received regarding tax exempt license duplication with another entity.",
        "critical",
        "open",
        new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      );
      insertReport.run(
        "rep_04",
        "usr_donor_1",
        "volunteer",
        "vol_prof_1",
        "Courier arrived 45 mins late without notice",
        "volunteer_issue",
        "Donor kitchen was delayed closing waiting for assigned courier pickup.",
        "low",
        "resolved",
        new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      );
    }
  } catch (err) {
    console.error("Reports migration check error:", err);
  }

  // Location and mapping columns migration upgrades
  const addColumnSafe = (table: string, col: string, type: string) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
    } catch {
      // Column already exists
    }
  };

  addColumnSafe("donor_profiles", "latitude", "REAL");
  addColumnSafe("donor_profiles", "longitude", "REAL");
  addColumnSafe("ngo_profiles", "latitude", "REAL");
  addColumnSafe("ngo_profiles", "longitude", "REAL");
  addColumnSafe("volunteer_profiles", "latitude", "REAL");
  addColumnSafe("volunteer_profiles", "longitude", "REAL");
  addColumnSafe("pickups", "pickup_lat", "REAL");
  addColumnSafe("pickups", "pickup_lng", "REAL");
  addColumnSafe("pickups", "delivery_lat", "REAL");
  addColumnSafe("pickups", "delivery_lng", "REAL");
  addColumnSafe("matches", "reasons", "TEXT");
  addColumnSafe("matches", "factors_json", "TEXT");

  // Ensure default coordinates for seeded records if null
  try {
    db.prepare(`UPDATE donor_profiles SET latitude = 37.7915, longitude = -122.3999 WHERE latitude IS NULL`).run();
    db.prepare(`UPDATE ngo_profiles SET latitude = 37.7858, longitude = -122.4042 WHERE latitude IS NULL`).run();
    db.prepare(`UPDATE volunteer_profiles SET latitude = 37.7702, longitude = -122.4225 WHERE latitude IS NULL`).run();
    db.prepare(`UPDATE pickups SET pickup_lat = 37.7915, pickup_lng = -122.3999, delivery_lat = 37.7858, delivery_lng = -122.4042 WHERE pickup_lat IS NULL`).run();
  } catch {
    // Ignore if not ready
  }

  // Production Performance Indexes
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_food_donations_status ON food_donations(status);
      CREATE INDEX IF NOT EXISTS idx_food_donations_coords ON food_donations(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_food_donations_available ON food_donations(available_until);
      CREATE INDEX IF NOT EXISTS idx_food_donations_donor ON food_donations(donor_id);
      CREATE INDEX IF NOT EXISTS idx_ngo_profiles_coords ON ngo_profiles(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_ngo_profiles_status ON ngo_profiles(verification_status);
      CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_status ON volunteer_profiles(availability_status, verification_status);
      CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_coords ON volunteer_profiles(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);
      CREATE INDEX IF NOT EXISTS idx_pickups_volunteer ON pickups(volunteer_id);
      CREATE INDEX IF NOT EXISTS idx_matches_donation_ngo ON matches(donation_id, ngo_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    `);
  } catch (err) {
    console.error("Index creation error:", err);
  }

  // 2. Check if seed data is needed
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    if (process.env.NODE_ENV === "production") {
      // In production: Create ONLY the bootstrap administrator account. Do NOT seed test/dummy accounts.
      seedProductionAdmin(db);
    } else {
      seedDatabase(db);
    }
  }
}

function seedProductionAdmin(db: Database.Database) {
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@sharebite.org";
  const adminPass = process.env.ADMIN_INITIAL_PASSWORD || "AdminShareBite2026!";
  const adminName = process.env.ADMIN_INITIAL_NAME || "System Administrator";
  const hash = bcrypt.hashSync(adminPass, 12);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, status)
    VALUES ('usr_admin_initial', ?, ?, ?, '+1 (555) 000-0001', 'admin', 'active')
  `).run(adminName, adminEmail, hash);

  console.log(`[PRODUCTION DB INITIALIZED] Initial administrator account created: ${adminEmail}`);
}

function seedDatabase(db: Database.Database) {
  const hash = bcrypt.hashSync("password123", 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDonorProfile = db.prepare(`
    INSERT INTO donor_profiles (id, user_id, organization_name, address, latitude, longitude, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNgoProfile = db.prepare(`
    INSERT INTO ngo_profiles (id, user_id, organization_name, address, latitude, longitude, contact_person, verification_status, capacity, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVolunteerProfile = db.prepare(`
    INSERT INTO volunteer_profiles (id, user_id, address, latitude, longitude, availability_status, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDonation = db.prepare(`
    INSERT INTO food_donations (
      id, donor_id, food_name, description, category, quantity, servings,
      preparation_time, available_until, storage_method, allergens, image_url,
      pickup_address, latitude, longitude, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRequest = db.prepare(`
    INSERT INTO food_requests (id, ngo_id, donation_id, requested_quantity, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMatch = db.prepare(`
    INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPickup = db.prepare(`
    INSERT INTO pickups (
      id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      status, accepted_at, picked_up_at, delivered_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, read_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, reviewer_id, reviewed_user_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertImpact = db.prepare(`
    INSERT OR REPLACE INTO impact_statistics (
      id, meals_rescued, food_weight_rescued, donations_completed, volunteers_involved, organizations_involved
    ) VALUES ('global_impact', 148500, 62400.0, 12940, 640, 466)
  `);

  // Transaction for atomic seed
  const runSeed = db.transaction(() => {
    // Users
    insertUser.run("usr_donor_1", "Chef Marco Rivera", "donor@sharebite.org", hash, "+1 (555) 234-8901", "donor", "active");
    insertUser.run("usr_ngo_1", "Elena Rostova", "ngo@sharebite.org", hash, "+1 (555) 876-5432", "ngo", "active");
    insertUser.run("usr_vol_1", "Marcus Vance", "volunteer@sharebite.org", hash, "+1 (555) 456-7890", "volunteer", "active");
    insertUser.run("usr_admin_1", "Sarah Lee", "admin@sharebite.org", hash, "+1 (555) 999-0001", "admin", "active");

    // Profiles
    insertDonorProfile.run("donor_prof_1", "usr_donor_1", "Green Leaf Bistro", "420 Market Street, San Francisco, CA 94105", 37.7915, -122.3999, "verified");
    insertNgoProfile.run(
      "ngo_prof_1",
      "usr_ngo_1",
      "Hope Kitchen & Shelter",
      "782 Mission Blvd, San Francisco, CA 94103",
      37.7858,
      -122.4042,
      "Elena Rostova",
      "verified",
      400,
      "Community kitchen and emergency shelter serving hot nutritious dinners to unhoused families."
    );
    insertVolunteerProfile.run("vol_prof_1", "usr_vol_1", "154 Valencia St, San Francisco, CA 94103", 37.7702, -122.4225, "available", "verified");

    // Food Donations
    const now = new Date();
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const eightHoursLater = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    insertDonation.run(
      "don_101",
      "donor_prof_1",
      "Freshly Cooked Veggie Pasta & Garlic Bread",
      "Prepared for evening corporate banquet but unopened. Sealed in temperature-controlled foil pans.",
      "Cooked Meals",
      18.5,
      45,
      now.toISOString(),
      fourHoursLater,
      "Heated Warmer (Above 60°C)",
      JSON.stringify(["Vegetarian", "Contains Gluten"]),
      "/images/donations/pasta.jpg",
      "420 Market Street, San Francisco, CA 94105",
      37.7915,
      -122.3999,
      "available",
      now.toISOString()
    );

    insertDonation.run(
      "don_102",
      "donor_prof_1",
      "Surplus Continental Breakfast Pastries & Bagels",
      "Assorted fresh croissants, multigrain bagels, and breakfast rolls baked this morning. Boxed and sealed.",
      "Bakery & Bread",
      15.0,
      70,
      now.toISOString(),
      eightHoursLater,
      "Room Temperature Dry Storage",
      JSON.stringify(["Vegetarian"]),
      "/images/donations/pastries.jpg",
      "420 Market Street, San Francisco, CA 94105",
      37.7915,
      -122.3999,
      "matched",
      now.toISOString()
    );

    insertDonation.run(
      "don_103",
      "donor_prof_1",
      "Organic Farm Fresh Greens & Heirloom Tomatoes",
      "Crates of raw crisp romaine lettuce, spinach, cucumber, and ripe tomatoes.",
      "Fresh Produce",
      35.0,
      80,
      now.toISOString(),
      tomorrow,
      "Refrigerated (4°C)",
      JSON.stringify(["Vegan", "Gluten Free"]),
      "/images/donations/produce.jpg",
      "420 Market Street, San Francisco, CA 94105",
      37.7915,
      -122.3999,
      "delivered",
      new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    );

    // Food Requests
    insertRequest.run("req_01", "ngo_prof_1", "don_101", 45, "pending");

    // Matches
    insertMatch.run("mat_01", "don_102", "ngo_prof_1", 96.5, 2.4, 85.0, "accepted");

    // Pickups
    insertPickup.run(
      "pik_01",
      "don_102",
      "vol_prof_1",
      "ngo_prof_1",
      "420 Market Street, San Francisco, CA",
      "782 Mission Blvd, San Francisco, CA",
      37.7915,
      -122.3999,
      37.7858,
      -122.4042,
      "assigned",
      now.toISOString(),
      null,
      null
    );

    insertPickup.run(
      "pik_02",
      "don_103",
      "vol_prof_1",
      "ngo_prof_1",
      "420 Market Street, San Francisco, CA",
      "782 Mission Blvd, San Francisco, CA",
      37.7915,
      -122.3999,
      37.7858,
      -122.4042,
      "delivered",
      new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
      new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString()
    );

    // Notifications
    insertNotification.run(
      "notif_01",
      "usr_donor_1",
      "Donation Matched!",
      "Hope Kitchen & Shelter claimed your Surplus Continental Breakfast Pastries.",
      "match_found",
      0
    );

    insertNotification.run(
      "notif_02",
      "usr_vol_1",
      "New Pickup Mission",
      "Surplus Continental Breakfast Pastries from Green Leaf Bistro assigned to you.",
      "pickup_assigned",
      0
    );

    insertNotification.run(
      "notif_03",
      "usr_ngo_1",
      "Volunteer En Route",
      "Courier Marcus Vance is en route with 70 portions from Green Leaf Bistro.",
      "delivery_completed",
      1
    );

    // Reviews
    insertReview.run(
      "rev_01",
      "usr_ngo_1",
      "usr_donor_1",
      5,
      "Food was fresh, warm, and sealed in high-grade food containers. Beneficiaries loved it!"
    );

    insertReview.run(
      "rev_02",
      "usr_ngo_1",
      "usr_vol_1",
      5,
      "Marcus delivered promptly with temperature-retaining bags. Professional and courteous."
    );

    // Impact Statistics
    insertImpact.run();
  });

  runSeed();
}
