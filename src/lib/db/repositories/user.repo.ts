import { getDb } from "../index";
import { UserProfile, UserRole } from "@/types/user";

export interface DbUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
  organization_name?: string;
  address?: string;
  contact_person?: string;
  verification_status?: string;
  capacity?: number;
  description?: string;
  availability_status?: string;
}

export class UserRepository {
  static createUser(userData: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    role: UserRole;
    status?: string;
    organizationName?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    contactPerson?: string;
    capacity?: number;
    description?: string;
    donorCategory?: string;
    volunteerVehicleType?: string;
  }): UserProfile {
    const db = getDb();

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertDonor = db.prepare(`
      INSERT INTO donor_profiles (id, user_id, organization_name, address, latitude, longitude, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNgo = db.prepare(`
      INSERT INTO ngo_profiles (id, user_id, organization_name, address, latitude, longitude, contact_person, verification_status, capacity, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVolunteer = db.prepare(`
      INSERT INTO volunteer_profiles (id, user_id, address, latitude, longitude, availability_status, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertUser.run(
        userData.id,
        userData.name,
        userData.email.toLowerCase(),
        userData.passwordHash,
        userData.phone,
        userData.role,
        userData.status || "active"
      );

      const lat = userData.latitude ?? 37.7749;
      const lng = userData.longitude ?? -122.4194;

      if (userData.role === "donor") {
        insertDonor.run(
          `donor_prof_${Date.now()}`,
          userData.id,
          userData.organizationName || userData.name,
          userData.address,
          lat,
          lng,
          "verified"
        );
      } else if (userData.role === "ngo") {
        insertNgo.run(
          `ngo_prof_${Date.now()}`,
          userData.id,
          userData.organizationName || userData.name,
          userData.address,
          lat,
          lng,
          userData.contactPerson || userData.name,
          "pending",
          userData.capacity || 150,
          userData.description || ""
        );
      } else if (userData.role === "volunteer") {
        insertVolunteer.run(
          `vol_prof_${Date.now()}`,
          userData.id,
          userData.address,
          lat,
          lng,
          "available",
          "verified"
        );
      }
    });

    transaction();

    return this.findUserById(userData.id)!;
  }

  static findUserByEmail(email: string): (UserProfile & { passwordHash: string }) | null {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT u.*,
               dp.organization_name as donor_org, dp.address as donor_addr, dp.latitude as donor_lat, dp.longitude as donor_lng, dp.verification_status as donor_verif,
               np.organization_name as ngo_org, np.address as ngo_addr, np.latitude as ngo_lat, np.longitude as ngo_lng, np.contact_person as ngo_contact, np.verification_status as ngo_verif,
               vp.address as vol_addr, vp.latitude as vol_lat, vp.longitude as vol_lng, vp.availability_status as vol_avail, vp.verification_status as vol_verif
        FROM users u
        LEFT JOIN donor_profiles dp ON u.id = dp.user_id
        LEFT JOIN ngo_profiles np ON u.id = np.user_id
        LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
        WHERE u.email = ? COLLATE NOCASE
      `)
      .get(email.trim().toLowerCase()) as any;

    if (!row) return null;

    return this.mapRowToUserProfile(row);
  }

  static findUserById(id: string): UserProfile | null {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT u.*,
               dp.organization_name as donor_org, dp.address as donor_addr, dp.latitude as donor_lat, dp.longitude as donor_lng, dp.verification_status as donor_verif,
               np.organization_name as ngo_org, np.address as ngo_addr, np.latitude as ngo_lat, np.longitude as ngo_lng, np.contact_person as ngo_contact, np.verification_status as ngo_verif,
               vp.address as vol_addr, vp.latitude as vol_lat, vp.longitude as vol_lng, vp.availability_status as vol_avail, vp.verification_status as vol_verif
        FROM users u
        LEFT JOIN donor_profiles dp ON u.id = dp.user_id
        LEFT JOIN ngo_profiles np ON u.id = np.user_id
        LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
        WHERE u.id = ?
      `)
      .get(id) as any;

    if (!row) return null;
    const { passwordHash, ...profile } = this.mapRowToUserProfile(row);
    return profile;
  }

  static getAllUsers(): UserProfile[] {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT u.*,
               dp.organization_name as donor_org, dp.address as donor_addr, dp.latitude as donor_lat, dp.longitude as donor_lng, dp.verification_status as donor_verif,
               np.organization_name as ngo_org, np.address as ngo_addr, np.latitude as ngo_lat, np.longitude as ngo_lng, np.contact_person as ngo_contact, np.verification_status as ngo_verif,
               vp.address as vol_addr, vp.latitude as vol_lat, vp.longitude as vol_lng, vp.availability_status as vol_avail, vp.verification_status as vol_verif
        FROM users u
        LEFT JOIN donor_profiles dp ON u.id = dp.user_id
        LEFT JOIN ngo_profiles np ON u.id = np.user_id
        LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
        ORDER BY u.created_at DESC
      `)
      .all() as any[];

    return rows.map((r) => {
      const { passwordHash, ...profile } = this.mapRowToUserProfile(r);
      return profile;
    });
  }

  static updateUserStatus(id: string, status: "active" | "suspended" | "pending"): boolean {
    const db = getDb();
    const res = db.prepare("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    return res.changes > 0;
  }

  private static mapRowToUserProfile(row: any): UserProfile & { passwordHash: string } {
    const addressStr = row.donor_addr || row.ngo_addr || row.vol_addr || "100 Civic Center, San Francisco, CA";
    
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      phone: row.phone,
      role: row.role as UserRole,
      address: {
        street: addressStr,
        city: "San Francisco",
        state: "CA",
        zipCode: "94103",
      },
      latitude: row.donor_lat || row.ngo_lat || row.vol_lat || undefined,
      longitude: row.donor_lng || row.ngo_lng || row.vol_lng || undefined,
      organizationName: row.donor_org || row.ngo_org,
      donorCategory: "Restaurant",
      ngoRegistrationNumber: row.role === "ngo" ? "NGO-501C3-88204" : undefined,
      ngoVerificationStatus: row.ngo_verif || undefined,
      volunteerVehicleType: row.role === "volunteer" ? "Bike" : undefined,
      createdAt: row.created_at,
    };
  }
}
