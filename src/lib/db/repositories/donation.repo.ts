import { getDb } from "../index";
import { DonationItem, DonationStatus, FoodCategory, FoodType } from "@/types/donation";
import { NotificationRepository } from "./notification.repo";
import { ImpactRepository } from "./impact.repo";

export class DonationRepository {
  /**
   * Automatically check for and expire any past-deadline active listings.
   */
  static checkAndExpireOverdueDonations(): number {
    const db = getDb();
    try {
      const overdue = db
        .prepare(`
          SELECT fd.id, fd.food_name, dp.user_id as donor_user_id
          FROM food_donations fd
          JOIN donor_profiles dp ON fd.donor_id = dp.id
          WHERE fd.status IN ('draft', 'published', 'available')
            AND datetime(fd.available_until) < datetime('now')
        `)
        .all() as { id: string; food_name: string; donor_user_id: string }[];

      if (overdue.length > 0) {
        const updateStmt = db.prepare("UPDATE food_donations SET status = 'expired' WHERE id = ?");
        for (const item of overdue) {
          updateStmt.run(item.id);
          NotificationRepository.createNotification({
            userId: item.donor_user_id,
            title: "Donation Expired",
            message: `Your food listing "${item.food_name}" has expired as the available-until window has elapsed.`,
            type: "donation_alert",
          });
        }
      }
      return overdue.length;
    } catch {
      return 0;
    }
  }

  static createDonation(data: {
    id?: string;
    donorUserId: string;
    foodName: string;
    description: string;
    category: FoodType;
    quantity: number;
    unit?: string;
    servings: number;
    preparationTime?: string;
    availableUntil: string;
    storageMethod?: string;
    allergens?: string[];
    imageUrl?: string;
    pickupAddress: string;
    latitude?: number;
    longitude?: number;
    specialInstructions?: string;
    status?: DonationStatus;
    safetyConfirmed?: boolean;
  }): DonationItem {
    const db = getDb();
    const id = data.id || `don_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Validate inputs
    if (!data.foodName || !data.foodName.trim()) {
      throw new Error("Food name is required.");
    }
    if (!data.category) {
      throw new Error("Food category is required.");
    }
    if (!data.quantity || data.quantity <= 0) {
      throw new Error("Quantity must be a positive number greater than 0.");
    }
    if (!data.servings || data.servings <= 0) {
      throw new Error("Number of servings must be a positive integer greater than 0.");
    }
    if (!data.pickupAddress || !data.pickupAddress.trim()) {
      throw new Error("Pickup address is required.");
    }
    if (!data.availableUntil) {
      throw new Error("Available-until date and time is required.");
    }

    const prepTimeMs = data.preparationTime ? new Date(data.preparationTime).getTime() : Date.now();
    const availUntilMs = new Date(data.availableUntil).getTime();

    if (isNaN(availUntilMs)) {
      throw new Error("Invalid available-until date format.");
    }
    if (data.preparationTime && isNaN(prepTimeMs)) {
      throw new Error("Invalid preparation date format.");
    }
    if (availUntilMs <= prepTimeMs) {
      throw new Error("Available-until time must be later than the preparation time.");
    }

    // Ensure donor profile exists
    let donorProfile = db
      .prepare("SELECT id, organization_name FROM donor_profiles WHERE user_id = ?")
      .get(data.donorUserId) as any;

    if (!donorProfile) {
      const profId = `donor_prof_${Date.now()}`;
      db.prepare(
        "INSERT INTO donor_profiles (id, user_id, organization_name, address) VALUES (?, ?, ?, ?)"
      ).run(profId, data.donorUserId, "Registered Food Donor", data.pickupAddress);
      donorProfile = { id: profId, organization_name: "Registered Food Donor" };
    }

    const initialStatus = data.status || "published";

    const insert = db.prepare(`
      INSERT INTO food_donations (
        id, donor_id, food_name, description, category, quantity, servings,
        preparation_time, available_until, storage_method, allergens, image_url,
        pickup_address, latitude, longitude, status, safety_declaration, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insert.run(
      id,
      donorProfile.id,
      data.foodName.trim(),
      data.description ? data.description.trim() : "",
      data.category,
      Number(data.quantity),
      Number(data.servings),
      data.preparationTime || new Date().toISOString(),
      data.availableUntil,
      data.storageMethod || "Room Temperature",
      JSON.stringify(data.allergens || []),
      data.imageUrl || null,
      data.pickupAddress.trim(),
      data.latitude || 37.7749,
      data.longitude || -122.4194,
      initialStatus,
      data.safetyConfirmed ? 1 : 1
    );

    // Initial alert if published
    if (initialStatus === "published") {
      NotificationRepository.createNotification({
        userId: data.donorUserId,
        title: "Donation Published",
        message: `Your food surplus listing "${data.foodName}" is now active and visible to verified NGOs.`,
        type: "donation_alert",
      });
    }

    return this.getDonationById(id)!;
  }

  static getDonations(filter?: {
    donorUserId?: string;
    status?: string;
    category?: string;
  }): DonationItem[] {
    this.checkAndExpireOverdueDonations();

    const db = getDb();
    let sql = `
      SELECT fd.*,
             dp.user_id as donor_user_id,
             dp.organization_name as donor_name,
             u.phone as donor_phone,
             u.name as donor_rep_name,
             p.id as pickup_id,
             p.status as pickup_status,
             p.delivered_at as pickup_delivered_at,
             np.id as claimed_ngo_id,
             np.organization_name as claimed_ngo_name,
             np.address as claimed_ngo_address,
             vp.id as assigned_volunteer_id,
             vu.name as assigned_volunteer_name,
             vu.phone as assigned_volunteer_phone
      FROM food_donations fd
      JOIN donor_profiles dp ON fd.donor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN matches m ON fd.id = m.donation_id AND m.status IN ('accepted', 'pending')
      LEFT JOIN ngo_profiles np ON m.ngo_id = np.id
      LEFT JOIN pickups p ON fd.id = p.donation_id
      LEFT JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
      LEFT JOIN users vu ON vp.user_id = vu.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.donorUserId) {
      sql += " AND dp.user_id = ?";
      params.push(filter.donorUserId);
    }

    if (filter?.status && filter.status !== "all") {
      const s = filter.status.toLowerCase();
      if (s === "active") {
        sql += " AND fd.status IN ('published', 'available', 'matched', 'accepted', 'pickup_assigned', 'in_transit', 'picked_up')";
      } else if (s === "pending") {
        sql += " AND fd.status IN ('draft', 'published', 'available', 'matched')";
      } else if (s === "matched") {
        sql += " AND fd.status IN ('matched', 'accepted')";
      } else if (s === "completed") {
        sql += " AND fd.status IN ('delivered', 'completed')";
      } else if (s === "expired") {
        sql += " AND fd.status = 'expired'";
      } else if (s === "cancelled") {
        sql += " AND fd.status = 'cancelled'";
      } else {
        sql += " AND fd.status = ?";
        params.push(filter.status);
      }
    }

    if (filter?.category && filter.category !== "all") {
      sql += " AND LOWER(fd.category) = LOWER(?)";
      params.push(filter.category);
    }

    sql += " ORDER BY fd.created_at DESC";

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(this.mapRowToDonationItem);
  }

  static getDonationById(id: string): DonationItem | null {
    this.checkAndExpireOverdueDonations();

    const db = getDb();
    const row = db
      .prepare(`
        SELECT fd.*,
               dp.user_id as donor_user_id,
               dp.organization_name as donor_name,
               u.phone as donor_phone,
               u.name as donor_rep_name,
               p.id as pickup_id,
               p.status as pickup_status,
               p.delivered_at as pickup_delivered_at,
               np.id as claimed_ngo_id,
               np.organization_name as claimed_ngo_name,
               np.address as claimed_ngo_address,
               vp.id as assigned_volunteer_id,
               vu.name as assigned_volunteer_name,
               vu.phone as assigned_volunteer_phone
        FROM food_donations fd
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        JOIN users u ON dp.user_id = u.id
        LEFT JOIN matches m ON fd.id = m.donation_id AND m.status IN ('accepted', 'pending')
        LEFT JOIN ngo_profiles np ON m.ngo_id = np.id
        LEFT JOIN pickups p ON fd.id = p.donation_id
        LEFT JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
        LEFT JOIN users vu ON vp.user_id = vu.id
        WHERE fd.id = ?
      `)
      .get(id) as any;

    if (!row) return null;
    return this.mapRowToDonationItem(row);
  }

  static updateDonationStatus(id: string, newStatus: DonationStatus): boolean {
    const db = getDb();

    // Fetch existing donation and donor info for notifications
    const existing = db
      .prepare(`
        SELECT fd.*, dp.user_id as donor_user_id
        FROM food_donations fd
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        WHERE fd.id = ?
      `)
      .get(id) as any;

    if (!existing) return false;

    const res = db.prepare("UPDATE food_donations SET status = ? WHERE id = ?").run(newStatus, id);
    if (res.changes === 0) return false;

    // Send notifications to donor based on lifecycle progression
    const donorUserId = existing.donor_user_id;
    const foodName = existing.food_name;

    switch (newStatus) {
      case "published":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Donation Published",
          message: `Your food surplus "${foodName}" is now active and ready for matching.`,
          type: "donation_alert",
        });
        break;

      case "matched":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "NGO Matched",
          message: `A nearby verified NGO has been matched to your donation "${foodName}".`,
          type: "match_found",
        });
        break;

      case "accepted":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Donation Accepted",
          message: `The NGO has accepted "${foodName}". A volunteer courier will be assigned shortly.`,
          type: "donation_alert",
        });
        break;

      case "pickup_assigned":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Volunteer Assigned",
          message: `A volunteer courier has been assigned to pick up "${foodName}" from your location.`,
          type: "pickup_assigned",
        });
        break;

      case "picked_up":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Food Picked Up",
          message: `Volunteer has collected "${foodName}". It is now in transit to the distribution site.`,
          type: "pickup_assigned",
        });
        break;

      case "delivered":
      case "completed":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Food Delivered & Rescued!",
          message: `"${foodName}" was safely delivered to the NGO. Thank you for rescuing food and helping your community!`,
          type: "delivery_completed",
        });
        // Automatically credit impact stats
        ImpactRepository.incrementImpact(
          existing.servings || 20,
          existing.quantity || 10
        );
        break;

      case "cancelled":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Donation Cancelled",
          message: `Donation "${foodName}" has been cancelled.`,
          type: "donation_alert",
        });
        break;

      case "expired":
        NotificationRepository.createNotification({
          userId: donorUserId,
          title: "Donation Expired",
          message: `Listing "${foodName}" expired before being collected.`,
          type: "donation_alert",
        });
        break;
    }

    return true;
  }

  /**
   * Advance donation to any lifecycle stage, creating corresponding Match and Pickup rows if needed.
   */
  static advanceLifecycle(id: string, targetStatus: DonationStatus): DonationItem | null {
    const db = getDb();
    const donation = this.getDonationById(id);
    if (!donation) return null;

    // Get default seed NGO and volunteer profiles
    const ngo = db.prepare("SELECT id, organization_name, address FROM ngo_profiles LIMIT 1").get() as any;
    const vol = db.prepare("SELECT id, address FROM volunteer_profiles LIMIT 1").get() as any;

    if (targetStatus === "matched" || targetStatus === "accepted") {
      if (ngo) {
        db.prepare(`
          INSERT OR REPLACE INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `match_${donation.id}`,
          donation.id,
          ngo.id,
          0.95,
          1.8,
          0.85,
          targetStatus === "accepted" ? "accepted" : "pending"
        );
      }
    }

    if (targetStatus === "pickup_assigned" || targetStatus === "picked_up" || targetStatus === "delivered" || targetStatus === "completed") {
      if (ngo && vol) {
        // Ensure match is marked accepted
        db.prepare(`
          INSERT OR REPLACE INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, status)
          VALUES (?, ?, ?, ?, ?, ?, 'accepted')
        `).run(`match_${donation.id}`, donation.id, ngo.id, 0.98, 1.2, 0.9);

        // Ensure pickup record exists
        const pickupStatus =
          targetStatus === "pickup_assigned" ? "assigned" :
          targetStatus === "picked_up" ? "picked_up" : "delivered";

        const deliveredAt = targetStatus === "delivered" || targetStatus === "completed" ? new Date().toISOString() : null;
        const pickedUpAt = targetStatus === "picked_up" || deliveredAt ? new Date().toISOString() : null;

        db.prepare(`
          INSERT OR REPLACE INTO pickups (
            id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location,
            status, accepted_at, picked_up_at, delivered_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
        `).run(
          `pick_${donation.id}`,
          donation.id,
          vol.id,
          ngo.id,
          donation.pickupAddress.street,
          ngo.address,
          pickupStatus,
          pickedUpAt,
          deliveredAt
        );
      }
    }

    this.updateDonationStatus(id, targetStatus);
    return this.getDonationById(id);
  }

  static getDonorStats(donorUserId: string) {
    this.checkAndExpireOverdueDonations();

    const db = getDb();
    const rows = db
      .prepare(`
        SELECT fd.id, fd.status, fd.servings, fd.quantity, fd.food_name, fd.created_at
        FROM food_donations fd
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        WHERE dp.user_id = ?
        ORDER BY fd.created_at DESC
      `)
      .all(donorUserId) as any[];

    let activeCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let mealsRescued = 0;
    let foodRescuedKg = 0;

    for (const r of rows) {
      const s = r.status.toLowerCase();
      if (["published", "available", "matched", "accepted", "pickup_assigned", "in_transit", "picked_up"].includes(s)) {
        activeCount++;
      }
      if (["delivered", "completed"].includes(s)) {
        completedCount++;
        mealsRescued += r.servings || 0;
        foodRescuedKg += r.quantity || 0;
      }
      if (["draft", "published", "available"].includes(s)) {
        pendingCount++;
      }
    }

    // Recent activity list
    const recentActivity = rows.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.food_name,
      status: r.status,
      servings: r.servings,
      createdAt: r.created_at,
    }));

    return {
      totalDonations: rows.length,
      activeDonations: activeCount,
      completedDonations: completedCount,
      pendingDonations: pendingCount,
      mealsRescued,
      foodRescuedKg: Math.round(foodRescuedKg * 10) / 10,
      recentActivity,
    };
  }

  /**
   * Edit donation details where allowed (only in 'draft' or 'published' status)
   */
  static updateDonationDetails(
    id: string,
    data: {
      foodName?: string;
      description?: string;
      category?: FoodCategory;
      quantity?: number;
      servings?: number;
      preparationTime?: string;
      availableUntil?: string;
      storageMethod?: string;
      allergens?: string[];
      imageUrl?: string;
      pickupAddress?: string;
      latitude?: number;
      longitude?: number;
      specialInstructions?: string;
    }
  ): DonationItem {
    const db = getDb();
    const existing = this.getDonationById(id);
    if (!existing) {
      throw new Error("Donation not found.");
    }

    if (existing.status !== "draft" && existing.status !== "published") {
      throw new Error(
        `Cannot edit donation in '${existing.status}' status. Editing is only permitted for draft or published listings.`
      );
    }

    if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity <= 0)) {
      throw new Error("Quantity must be a positive number greater than 0.");
    }
    if (data.servings !== undefined && (isNaN(data.servings) || data.servings <= 0)) {
      throw new Error("Servings must be a positive integer greater than 0.");
    }
    if (data.availableUntil) {
      const availMs = new Date(data.availableUntil).getTime();
      const prepMs = data.preparationTime
        ? new Date(data.preparationTime).getTime()
        : existing.preparationTime
        ? new Date(existing.preparationTime).getTime()
        : Date.now();
      if (isNaN(availMs)) throw new Error("Invalid availableUntil date format.");
      if (availMs <= prepMs)
        throw new Error("Available-until time must be later than the preparation time.");
    }

    db.prepare(`
      UPDATE food_donations
      SET food_name = COALESCE(?, food_name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          quantity = COALESCE(?, quantity),
          servings = COALESCE(?, servings),
          preparation_time = COALESCE(?, preparation_time),
          available_until = COALESCE(?, available_until),
          storage_method = COALESCE(?, storage_method),
          allergens = COALESCE(?, allergens),
          image_url = COALESCE(?, image_url),
          pickup_address = COALESCE(?, pickup_address),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude)
      WHERE id = ?
    `).run(
      data.foodName !== undefined ? data.foodName.trim() : null,
      data.description !== undefined ? data.description.trim() : null,
      data.category || null,
      data.quantity !== undefined ? Number(data.quantity) : null,
      data.servings !== undefined ? Number(data.servings) : null,
      data.preparationTime || null,
      data.availableUntil || null,
      data.storageMethod || null,
      data.allergens !== undefined ? JSON.stringify(data.allergens) : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.pickupAddress !== undefined ? data.pickupAddress.trim() : null,
      data.latitude !== undefined ? data.latitude : null,
      data.longitude !== undefined ? data.longitude : null,
      id
    );

    return this.getDonationById(id)!;
  }

  private static mapRowToDonationItem(row: any): DonationItem {
    let dietary: string[] = [];
    try {
      if (row.allergens) {
        dietary = JSON.parse(row.allergens);
      }
    } catch {
      dietary = row.allergens ? [row.allergens] : [];
    }

    return {
      id: row.id,
      donorId: row.donor_user_id || row.donor_id,
      donorName: row.donor_name || "Green Leaf Bistro",
      donorCategory: "Restaurant",
      donorPhone: row.donor_phone || "+1 (555) 234-8901",
      title: row.food_name,
      description: row.description || "",
      foodType: row.category as FoodType,
      quantity: row.quantity,
      unit: "servings",
      servingsEstimate: row.servings,
      perishableHours: 4,
      preparationTime: row.preparation_time,
      preparedAt: row.preparation_time,
      availableUntil: row.available_until,
      expiresAt: row.available_until,
      storageMethod: row.storage_method || "Room Temperature",
      dietaryInfo: dietary,
      allergens: dietary,
      imageUrl: row.image_url || undefined,
      pickupAddress: {
        street: row.pickup_address,
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
      },
      locationName: row.pickup_address,
      latitude: row.latitude,
      longitude: row.longitude,
      safetyConfirmed: row.safety_declaration === 1,
      status: row.status as DonationStatus,
      claimedByNgoId: row.claimed_ngo_id,
      claimedByNgoName: row.claimed_ngo_name,
      claimedNgoAddress: row.claimed_ngo_address,
      assignedVolunteerId: row.assigned_volunteer_id,
      assignedVolunteerName: row.assigned_volunteer_name,
      assignedVolunteerPhone: row.assigned_volunteer_phone,
      createdAt: row.created_at,
      completedAt: row.pickup_delivered_at || (["delivered", "completed"].includes(row.status) ? row.created_at : undefined),
    };
  }
}
