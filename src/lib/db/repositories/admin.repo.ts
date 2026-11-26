import { getDb } from "../index";
import { NotificationRepository } from "./notification.repo";
import { ReportCategory } from "@/types/report";
import { predictDonationUrgency } from "@/lib/matching/urgency";

export interface AdminOverviewStats {
  totalUsers: number;
  activeDonors: number;
  verifiedNgos: number;
  activeVolunteers: number;
  activeDonations: number;
  completedDonations: number;
  mealsRescued: number;
  estimatedShareBitedKg: number;
  expiredDonations: number;
  pendingNgos: number;
  openReports: number;
  urgencyBreakdown?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "donor" | "ngo" | "volunteer" | "admin";
  status: "active" | "suspended" | "pending";
  createdAt: string;
  updatedAt: string;
  organizationName?: string;
  address?: string;
  verificationStatus?: string;
  vehicleType?: string;
}

export class AdminRepository {
  /**
   * 1. Admin Overview: Real-time statistics from SQLite database
   */
  static getOverviewStats(): AdminOverviewStats {
    const db = getDb();

    // 1. Total users
    const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any)?.count || 0;

    // 2. Active donors
    const activeDonors = (
      db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'donor' AND status = 'active'").get() as any
    )?.count || 0;

    // 3. Verified NGOs
    const verifiedNgos = (
      db.prepare("SELECT COUNT(*) as count FROM ngo_profiles WHERE verification_status = 'verified'").get() as any
    )?.count || 0;

    // 4. Active volunteers
    const activeVolunteers = (
      db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'volunteer' AND status = 'active'").get() as any
    )?.count || 0;

    // 5. Active donations
    const activeDonations = (
      db.prepare(`
        SELECT COUNT(*) as count
        FROM food_donations
        WHERE status IN ('published', 'available', 'matched', 'accepted', 'pickup_assigned', 'in_transit')
      `).get() as any
    )?.count || 0;

    // 6. Completed donations
    const completedDonations = (
      db.prepare("SELECT COUNT(*) as count FROM food_donations WHERE status IN ('delivered', 'completed')").get() as any
    )?.count || 0;

    // 7. Meals rescued
    const mealsRescued = (
      db.prepare("SELECT COALESCE(SUM(servings), 0) as total FROM food_donations WHERE status IN ('delivered', 'completed')").get() as any
    )?.total || 0;

    // 8. Estimated food rescued (kg)
    const estimatedShareBitedKg = Math.round(
      ((db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM food_donations WHERE status IN ('delivered', 'completed')").get() as any)?.total || 0) * 10
    ) / 10;

    // 9. Expired donations
    const expiredDonations = (
      db.prepare(`
        SELECT COUNT(*) as count
        FROM food_donations
        WHERE status = 'expired' OR (available_until < CURRENT_TIMESTAMP AND status IN ('published', 'available'))
      `).get() as any
    )?.count || 0;

    // Auxiliary
    const pendingNgos = (
      db.prepare("SELECT COUNT(*) as count FROM ngo_profiles WHERE verification_status = 'pending'").get() as any
    )?.count || 0;

    const openReports = (
      db.prepare("SELECT COUNT(*) as count FROM reports WHERE status IN ('open', 'investigating')").get() as any
    )?.count || 0;

    // Real-time urgency breakdown for active donations
    const activeDonationRows = db.prepare(`
      SELECT id, food_name, category, available_until, preparation_time, storage_method, quantity, servings, latitude, longitude
      FROM food_donations
      WHERE status IN ('published', 'available', 'matched', 'accepted', 'pickup_assigned', 'in_transit')
    `).all() as any[];

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const d of activeDonationRows) {
      const pred = predictDonationUrgency({
        availableUntil: d.available_until,
        preparationTime: d.preparation_time,
        foodCategory: d.category,
        storageMethod: d.storage_method,
        quantity: Number(d.quantity) || 1,
        servings: Number(d.servings) || 10,
        pickupLat: d.latitude,
        pickupLng: d.longitude,
      });

      if (pred.level === "critical") critical++;
      else if (pred.level === "high") high++;
      else if (pred.level === "medium") medium++;
      else low++;
    }

    return {
      totalUsers,
      activeDonors,
      verifiedNgos,
      activeVolunteers,
      activeDonations,
      completedDonations,
      mealsRescued,
      estimatedShareBitedKg,
      expiredDonations,
      pendingNgos,
      openReports,
      urgencyBreakdown: {
        critical,
        high,
        medium,
        low,
      },
    };
  }

  /**
   * 2. User Management: Search, filter by role/status, soft activation/deactivation
   */
  static getAllUsers(filter?: { search?: string; role?: string; status?: string }): AdminUserRecord[] {
    const db = getDb();
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at,
             dp.organization_name as donor_org, dp.address as donor_addr, dp.verification_status as donor_verif,
             np.organization_name as ngo_org, np.address as ngo_addr, np.verification_status as ngo_verif,
             vp.address as vol_addr, vp.verification_status as vol_verif, vp.vehicle_type
      FROM users u
      LEFT JOIN donor_profiles dp ON u.id = dp.user_id
      LEFT JOIN ngo_profiles np ON u.id = np.user_id
      LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filter?.role && filter.role !== "all" && filter.role !== "All") {
      query += ` AND u.role = ?`;
      params.push(filter.role.toLowerCase());
    }

    if (filter?.status && filter.status !== "all" && filter.status !== "All") {
      query += ` AND u.status = ?`;
      params.push(filter.status.toLowerCase());
    }

    if (filter?.search) {
      const s = `%${filter.search.toLowerCase()}%`;
      query += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(dp.organization_name, np.organization_name, '')) LIKE ?)`;
      params.push(s, s, s);
    }

    query += ` ORDER BY u.created_at DESC`;

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: r.role,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      organizationName: r.donor_org || r.ngo_org || undefined,
      address: r.donor_addr || r.ngo_addr || r.vol_addr || "Address on File",
      verificationStatus: r.donor_verif || r.ngo_verif || r.vol_verif || "verified",
      vehicleType: r.vehicle_type || undefined,
    }));
  }

  static getUserDetails(userId: string): any {
    const db = getDb();
    const user = db.prepare("SELECT id, name, email, phone, role, status, created_at, updated_at FROM users WHERE id = ?").get(userId) as any;
    if (!user) return null;

    let profile: any = null;
    let activity: any[] = [];

    if (user.role === "donor") {
      profile = db.prepare("SELECT * FROM donor_profiles WHERE user_id = ?").get(userId);
      activity = db.prepare("SELECT id, food_name, servings, status, created_at FROM food_donations WHERE donor_id = ? ORDER BY id DESC LIMIT 5").all(profile?.id || "");
    } else if (user.role === "ngo") {
      profile = db.prepare("SELECT * FROM ngo_profiles WHERE user_id = ?").get(userId);
      activity = db.prepare(`
        SELECT p.id, fd.food_name, p.status, p.accepted_at, p.delivered_at
        FROM pickups p
        JOIN food_donations fd ON p.donation_id = fd.id
        WHERE p.ngo_id = ?
        ORDER BY p.id DESC LIMIT 5
      `).all(profile?.id || "");
    } else if (user.role === "volunteer") {
      profile = db.prepare("SELECT * FROM volunteer_profiles WHERE user_id = ?").get(userId);
      activity = db.prepare(`
        SELECT p.id, fd.food_name, p.status, p.delivered_at
        FROM pickups p
        JOIN food_donations fd ON p.donation_id = fd.id
        WHERE p.volunteer_id = ?
        ORDER BY p.id DESC LIMIT 5
      `).all(profile?.id || "");
    }

    return {
      user,
      profile,
      activity,
    };
  }

  /**
   * Soft activation / deactivation of user
   */
  static setUserStatus(userId: string, status: "active" | "suspended", adminUserId?: string): boolean {
    const db = getDb();

    // Prevent self-deactivation if admin
    if (adminUserId && adminUserId === userId && status === "suspended") {
      throw new Error("Action Prohibited: Admins cannot deactivate their own active administrative account.");
    }

    const res = db.prepare(`
      UPDATE users
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, userId);

    if (res.changes > 0) {
      NotificationRepository.createNotification({
        userId,
        title: status === "active" ? "Account Activated" : "Account Suspended",
        message: status === "active"
          ? "Your ShareBite account has been reviewed and activated by administration."
          : "Your account access has been temporarily suspended by platform compliance.",
        type: "verification_update",
      });
      return true;
    }
    return false;
  }

  /**
   * 3. NGO Verification: Applications, review, verify, reject, suspend
   */
  static getNgoApplications(statusFilter?: string): any[] {
    const db = getDb();
    let query = `
      SELECT np.*, u.name as rep_name, u.email as rep_email, u.phone as rep_phone, u.status as user_status
      FROM ngo_profiles np
      JOIN users u ON np.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statusFilter && statusFilter !== "all" && statusFilter !== "All") {
      query += ` AND np.verification_status = ?`;
      params.push(statusFilter.toLowerCase());
    }

    query += ` ORDER BY CASE WHEN np.verification_status = 'pending' THEN 1 ELSE 2 END, np.id DESC`;

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => {
      let categories: string[] = [];
      try {
        categories = JSON.parse(r.preferred_categories || "[]");
      } catch {
        categories = ["Cooked Meals", "Bakery & Bread"];
      }

      return {
        id: r.id,
        userId: r.user_id,
        name: r.organization_name,
        address: r.address,
        contactPerson: r.contact_person,
        verificationStatus: r.verification_status,
        capacityPerDay: r.capacity || 100,
        currentRequirement: r.current_requirement || 50,
        foodPreferences: categories,
        registrationNumber: r.registration_number || "NGO-501C3-88204",
        operationalHours: r.operational_hours || "7:00 AM - 9:00 PM",
        description: r.description || "Community relief organization providing hunger relief.",
        documentsSubmitted: ["501c3_Tax_Exemption.pdf", "Food_Safety_Inspection.pdf"],
        email: r.rep_email,
        phone: r.rep_phone,
      };
    });
  }

  static updateNgoStatus(
    ngoId: string,
    status: "verified" | "rejected" | "suspended" | "pending",
    notes?: string
  ): boolean {
    const db = getDb();
    const res = db.prepare(`
      UPDATE ngo_profiles
      SET verification_status = ?
      WHERE id = ?
    `).run(status, ngoId);

    if (res.changes > 0) {
      const ngo = db.prepare("SELECT user_id, organization_name FROM ngo_profiles WHERE id = ?").get(ngoId) as any;
      if (ngo?.user_id) {
        let msg = `Your organization "${ngo.organization_name}" verification status is now "${status}".`;
        if (status === "verified") {
          msg = `Congratulations! "${ngo.organization_name}" has been verified. You may now request and receive surplus food.`;
        } else if (status === "rejected") {
          msg = `Your verification application was rejected by compliance. ${notes ? `Reason: ${notes}` : ""}`;
        } else if (status === "suspended") {
          msg = `Your food claim access has been suspended pending safety review. ${notes ? `Reason: ${notes}` : ""}`;
        }

        NotificationRepository.createNotification({
          userId: ngo.user_id,
          title: `NGO Status: ${status.toUpperCase()}`,
          message: msg,
          type: "verification_update",
        });
      }
      return true;
    }
    return false;
  }

  /**
   * 4. Donation Management: View, search, investigate reports, cancel listings
   */
  static getAllDonations(filter?: { status?: string; search?: string }): any[] {
    const db = getDb();
    let query = `
      SELECT fd.*,
             dp.organization_name as donor_name,
             u.phone as donor_phone,
             u.email as donor_email,
             np.organization_name as claimed_ngo_name,
             p.status as pickup_status,
             vu.name as courier_name
      FROM food_donations fd
      JOIN donor_profiles dp ON fd.donor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN matches m ON fd.id = m.donation_id AND m.status = 'accepted'
      LEFT JOIN ngo_profiles np ON m.ngo_id = np.id
      LEFT JOIN pickups p ON fd.id = p.donation_id
      LEFT JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
      LEFT JOIN users vu ON vp.user_id = vu.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filter?.status && filter.status !== "all" && filter.status !== "All") {
      query += ` AND fd.status = ?`;
      params.push(filter.status.toLowerCase());
    }

    if (filter?.search) {
      const s = `%${filter.search.toLowerCase()}%`;
      query += ` AND (LOWER(fd.food_name) LIKE ? OR LOWER(dp.organization_name) LIKE ? OR LOWER(fd.category) LIKE ?)`;
      params.push(s, s, s);
    }

    query += ` ORDER BY fd.id DESC`;

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => {
      let allergens: string[] = [];
      try {
        allergens = JSON.parse(r.allergens || "[]");
      } catch {
        allergens = [];
      }

      return {
        id: r.id,
        title: r.food_name,
        description: r.description || "",
        foodType: r.category,
        quantity: r.quantity,
        servingsEstimate: r.servings,
        status: r.status,
        donorName: r.donor_name || "Commercial Donor",
        donorPhone: r.donor_phone,
        donorEmail: r.donor_email,
        pickupAddress: r.pickup_address,
        availableUntil: r.available_until,
        storageMethod: r.storage_method,
        allergens,
        claimedByNGO: r.claimed_ngo_name || undefined,
        courierName: r.courier_name || undefined,
        pickupStatus: r.pickup_status || undefined,
        createdAt: r.created_at,
      };
    });
  }

  static cancelDonation(donationId: string, reason: string): boolean {
    const db = getDb();
    const don = db.prepare("SELECT donor_id, food_name FROM food_donations WHERE id = ?").get(donationId) as any;
    if (!don) throw new Error("Donation not found.");

    const res = db.prepare(`
      UPDATE food_donations
      SET status = 'cancelled'
      WHERE id = ?
    `).run(donationId);

    // Cancel any associated pickups
    db.prepare("UPDATE pickups SET status = 'cancelled' WHERE donation_id = ?").run(donationId);

    if (res.changes > 0) {
      const donorUser = db.prepare("SELECT user_id FROM donor_profiles WHERE id = ?").get(don.donor_id) as any;
      if (donorUser?.user_id) {
        NotificationRepository.createNotification({
          userId: donorUser.user_id,
          title: "Listing Cancelled by Admin",
          message: `Your listing "${don.food_name}" was cancelled by compliance. Reason: ${reason}`,
          type: "donation_alert",
        });
      }
      return true;
    }
    return false;
  }

  /**
   * 5. Volunteer Management: View volunteers, verify, activate/deactivate, trip counts
   */
  static getVolunteers(filter?: { search?: string; status?: string; verificationStatus?: string }): any[] {
    const db = getDb();
    let query = `
      SELECT vp.*, u.name, u.email, u.phone, u.status as user_status,
             (SELECT COUNT(*) FROM pickups p WHERE p.volunteer_id = vp.id AND p.status IN ('delivered', 'completed')) as completed_trips,
             (SELECT COALESCE(SUM(fd.servings), 0) FROM pickups p JOIN food_donations fd ON p.donation_id = fd.id WHERE p.volunteer_id = vp.id AND p.status IN ('delivered', 'completed')) as meals_delivered
      FROM volunteer_profiles vp
      JOIN users u ON vp.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filter?.verificationStatus && filter.verificationStatus !== "all" && filter.verificationStatus !== "All") {
      query += ` AND vp.verification_status = ?`;
      params.push(filter.verificationStatus.toLowerCase());
    }

    if (filter?.status && filter.status !== "all" && filter.status !== "All") {
      query += ` AND u.status = ?`;
      params.push(filter.status.toLowerCase());
    }

    if (filter?.search) {
      const s = `%${filter.search.toLowerCase()}%`;
      query += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)`;
      params.push(s, s);
    }

    query += ` ORDER BY vp.id DESC`;

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      userStatus: r.user_status,
      address: r.address,
      vehicleType: r.vehicle_type || "Bike",
      preferredRadius: r.preferred_radius || 5,
      availabilityStatus: r.availability_status,
      verificationStatus: r.verification_status,
      completedTrips: r.completed_trips || 0,
      mealsDelivered: r.meals_delivered || 0,
      volunteerPoints: (r.completed_trips || 0) * 50 + Math.round((r.meals_delivered || 0) * 0.5),
    }));
  }

  static updateVolunteerVerification(volunteerUserId: string, verificationStatus: "verified" | "rejected"): boolean {
    const db = getDb();
    const res = db.prepare(`
      UPDATE volunteer_profiles
      SET verification_status = ?
      WHERE user_id = ?
    `).run(verificationStatus, volunteerUserId);

    if (res.changes > 0) {
      NotificationRepository.createNotification({
        userId: volunteerUserId,
        title: verificationStatus === "verified" ? "Volunteer Profile Verified" : "Verification Rejected",
        message: verificationStatus === "verified"
          ? "You are now verified to claim food rescue deliveries across the network."
          : "Your courier verification was not approved.",
        type: "verification_update",
      });
      return true;
    }
    return false;
  }

  /**
   * 6. Reports Management System
   * Categories: incorrect_donation, food_safety_concern, fake_organization, volunteer_issue, other
   */
  static getReports(filter?: { category?: string; status?: string; severity?: string }): any[] {
    const db = getDb();
    let query = `
      SELECT r.*, u.name as reporter_name, u.email as reporter_email, u.role as reporter_role
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filter?.category && filter.category !== "all" && filter.category !== "All") {
      query += ` AND r.category = ?`;
      params.push(filter.category.toLowerCase());
    }

    if (filter?.status && filter.status !== "all" && filter.status !== "All") {
      query += ` AND r.status = ?`;
      params.push(filter.status.toLowerCase());
    }

    if (filter?.severity && filter.severity !== "all" && filter.severity !== "All") {
      query += ` AND r.severity = ?`;
      params.push(filter.severity.toLowerCase());
    }

    query += ` ORDER BY CASE WHEN r.status = 'open' THEN 1 WHEN r.status = 'investigating' THEN 2 ELSE 3 END, r.created_at DESC`;

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reportedBy: r.reporter_name,
      reportedRole: r.reporter_role,
      reportedEntityType: r.reported_entity_type,
      reportedEntityId: r.reported_entity_id,
      reportedTitle: r.reported_title,
      category: r.category,
      description: r.description,
      severity: r.severity,
      status: r.status,
      adminNotes: r.admin_notes || undefined,
      resolvedAt: r.resolved_at || undefined,
      createdAt: r.created_at,
    }));
  }

  static updateReportStatus(
    reportId: string,
    status: "open" | "investigating" | "resolved" | "dismissed",
    adminNotes?: string
  ): boolean {
    const db = getDb();
    const resolvedCol = (status === "resolved" || status === "dismissed") ? ", resolved_at = CURRENT_TIMESTAMP" : "";

    const res = db.prepare(`
      UPDATE reports
      SET status = ?,
          admin_notes = COALESCE(?, admin_notes)
          ${resolvedCol}
      WHERE id = ?
    `).run(status, adminNotes || null, reportId);

    return res.changes > 0;
  }

  static createReport(data: {
    reporterId: string;
    reportedEntityType: "donation" | "ngo" | "donor" | "volunteer" | "other";
    reportedEntityId?: string;
    reportedTitle: string;
    category: ReportCategory;
    description: string;
    severity?: "low" | "medium" | "high" | "critical";
  }): any {
    const db = getDb();
    const id = `rep_${Date.now()}`;
    const severity = data.severity || "medium";

    db.prepare(`
      INSERT INTO reports (id, reporter_id, reported_entity_type, reported_entity_id, reported_title, category, description, severity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(
      id,
      data.reporterId,
      data.reportedEntityType,
      data.reportedEntityId || null,
      data.reportedTitle,
      data.category,
      data.description,
      severity
    );

    return { id, ...data, severity, status: "open", createdAt: new Date().toISOString() };
  }

  /**
   * 7. Analytics: Aggregations for all charts using real database data
   */
  static getAnalytics(): any {
    const db = getDb();

    // 1. Food Categories Breakdown
    const catRows = db.prepare(`
      SELECT category,
             COUNT(*) as count,
             COALESCE(SUM(servings), 0) as total_servings,
             COALESCE(SUM(quantity), 0) as total_kg
      FROM food_donations
      GROUP BY category
      ORDER BY total_servings DESC
    `).all() as any[];

    const totalServings = catRows.reduce((acc, c) => acc + c.total_servings, 0) || 1;
    const foodCategories = catRows.map((c) => ({
      category: c.category,
      count: c.count,
      servings: c.total_servings,
      weightKg: Math.round(c.total_kg * 10) / 10,
      percentage: Math.round((c.total_servings / totalServings) * 100),
    }));

    // 2. Completed vs Expired vs Cancelled vs Active
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM food_donations
      GROUP BY status
    `).all() as any[];

    const statusMap: Record<string, number> = {};
    for (const s of statusCounts) {
      statusMap[s.status] = s.count;
    }

    const completedCount = (statusMap["completed"] || 0) + (statusMap["delivered"] || 0);
    const expiredCount = statusMap["expired"] || 0;
    const cancelledCount = statusMap["cancelled"] || 0;
    const activeCount =
      (statusMap["published"] || 0) +
      (statusMap["available"] || 0) +
      (statusMap["matched"] || 0) +
      (statusMap["accepted"] || 0) +
      (statusMap["pickup_assigned"] || 0) +
      (statusMap["in_transit"] || 0);

    // 3. User Fleet Breakdown
    const donorsCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'donor'").get() as any)?.c || 0;
    const ngosCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'ngo'").get() as any)?.c || 0;
    const volunteersCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'volunteer'").get() as any)?.c || 0;

    // 4. Top Active Donors
    const topDonors = db.prepare(`
      SELECT dp.organization_name, COUNT(fd.id) as donation_count, COALESCE(SUM(fd.servings), 0) as total_servings
      FROM donor_profiles dp
      JOIN food_donations fd ON dp.id = fd.donor_id
      GROUP BY dp.id
      ORDER BY total_servings DESC
      LIMIT 5
    `).all() as any[];

    // 5. Top NGOs by meals claimed
    const topNgos = db.prepare(`
      SELECT np.organization_name, COUNT(p.id) as deliveries_received, COALESCE(SUM(fd.servings), 0) as total_servings
      FROM ngo_profiles np
      JOIN pickups p ON np.id = p.ngo_id
      JOIN food_donations fd ON p.donation_id = fd.id
      WHERE p.status IN ('delivered', 'completed')
      GROUP BY np.id
      ORDER BY total_servings DESC
      LIMIT 5
    `).all() as any[];

    // 6. Volunteer Fleet Vehicle distribution
    const vehicles = db.prepare(`
      SELECT COALESCE(vehicle_type, 'Bike') as vehicle, COUNT(*) as count
      FROM volunteer_profiles
      GROUP BY vehicle_type
    `).all() as any[];

    return {
      foodCategories,
      completedVsExpired: {
        completed: completedCount,
        expired: expiredCount,
        cancelled: cancelledCount,
        active: activeCount,
      },
      userDistribution: {
        donors: donorsCount,
        ngos: ngosCount,
        volunteers: volunteersCount,
      },
      topDonors,
      topNgos,
      vehicles,
    };
  }
}
