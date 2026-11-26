import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const configuredPath = process.env.DATABASE_PATH || "./data/foodrescue.db";
const dbPath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.join(process.cwd(), configuredPath);

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const email = process.argv[2] || process.env.ADMIN_INITIAL_EMAIL || "admin@sharebite.org";
const password = process.argv[3] || process.env.ADMIN_INITIAL_PASSWORD || "AdminShareBite2026!";
const name = process.argv[4] || process.env.ADMIN_INITIAL_NAME || "System Administrator";

if (password.length < 8) {
  console.error("❌ Error: Admin password must be at least 8 characters.");
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// Check if user already exists
const existing = db.prepare("SELECT id, role FROM users WHERE email = ?").get(email);
const hash = bcrypt.hashSync(password, 12);

if (existing) {
  db.prepare(`
    UPDATE users
    SET password_hash = ?, role = 'admin', status = 'active', name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
  `).run(hash, name, email);
  console.log(`✅ Existing user "${email}" updated to Administrator role with new password.`);
} else {
  const adminId = `usr_admin_${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, '+1 (555) 000-0001', 'admin', 'active')
  `).run(adminId, name, email, hash);
  console.log(`✅ Initial Administrator account created successfully:`);
  console.log(`   Email: ${email}`);
  console.log(`   Name:  ${name}`);
  console.log(`   Role:  admin`);
}

db.close();
