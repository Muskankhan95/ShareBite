-- FoodRescue Relational Database Schema
-- Normalized SQLite Schema with Foreign Keys, Constraints, and Indexes

PRAGMA foreign_keys = ON;

-- 1. Users Table
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

-- 2. Donor Profiles Table
CREATE TABLE IF NOT EXISTS donor_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  organization_name TEXT,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. NGO Profiles Table
CREATE TABLE IF NOT EXISTS ngo_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  organization_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
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

-- 4. Volunteer Profiles Table
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK(availability_status IN ('available', 'unavailable', 'busy', 'offline')),
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected')),
  vehicle_type TEXT DEFAULT 'Bike',
  preferred_radius INTEGER DEFAULT 5,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Food Donations Table
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

-- 6. Food Requests Table
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

-- 7. Matches Table
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

-- 8. Pickups Table
CREATE TABLE IF NOT EXISTS pickups (
  id TEXT PRIMARY KEY,
  donation_id TEXT NOT NULL,
  volunteer_id TEXT,
  ngo_id TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  pickup_lat REAL,
  pickup_lng REAL,
  delivery_lat REAL,
  delivery_lng REAL,
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

-- 9. Notifications Table
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

-- 10. Reviews Table
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

-- 11. Impact Statistics Snapshot / Summary Table
CREATE TABLE IF NOT EXISTS impact_statistics (
  id TEXT PRIMARY KEY DEFAULT 'global_impact',
  meals_rescued INTEGER NOT NULL DEFAULT 0,
  food_weight_rescued REAL NOT NULL DEFAULT 0.0,
  donations_completed INTEGER NOT NULL DEFAULT 0,
  volunteers_involved INTEGER NOT NULL DEFAULT 0,
  organizations_involved INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Reports Table (Admin Governance & Incident Moderation)
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

-- Indexes for Fast Querying and Relationship Joins
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_user ON donor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_user ON ngo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_user ON volunteer_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_food_donations_donor ON food_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_food_donations_status ON food_donations(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_food_donations_available_until ON food_donations(available_until);

CREATE INDEX IF NOT EXISTS idx_food_requests_ngo ON food_requests(ngo_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_donation ON food_requests(donation_id);

CREATE INDEX IF NOT EXISTS idx_matches_donation ON matches(donation_id);
CREATE INDEX IF NOT EXISTS idx_matches_ngo ON matches(ngo_id);

CREATE INDEX IF NOT EXISTS idx_pickups_donation ON pickups(donation_id);
CREATE INDEX IF NOT EXISTS idx_pickups_volunteer ON pickups(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_pickups_ngo ON pickups(ngo_id);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_user_id);
