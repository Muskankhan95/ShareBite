import { getDb } from "../index";
import { NGOProfile, FoodRequest, NGOVerificationStatus } from "@/types/ngo";
import { DonationItem, DonationStatus } from "@/types/donation";
import { NotificationRepository } from "./notification.repo";
import { DonationRepository } from "./donation.repo";
import { calculateHaversineDistance, calculateTravelTimeMinutes } from "@/lib/utils/geo";

export class NGORepository {
  static getNgoProfileByUserId(userId: string): NGOProfile | null {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT np.*, u.email, u.phone
        FROM ngo_profiles np
        JOIN users u ON np.user_id = u.id
        WHERE np.user_id = ?
      `)
      .get(userId) as any;

    if (!row) return null;
    return this.mapRowToNgoProfile(row);
  }

  static getNgoProfileById(id: string): NGOProfile | null {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT np.*, u.email, u.phone
        FROM ngo_profiles np
        JOIN users u ON np.user_id = u.id
        WHERE np.id = ?
      `)
      .get(id) as any;

    if (!row) return null;
    return this.mapRowToNgoProfile(row);
  }

  static getAllNgos(): NGOProfile[] {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT np.*, u.email, u.phone
        FROM ngo_profiles np
        JOIN users u ON np.user_id = u.id
        ORDER BY np.organization_name ASC
      `)
      .all() as any[];

    return rows.map(this.mapRowToNgoProfile);
  }

  static updateVerificationStatus(ngoId: string, status: NGOVerificationStatus): boolean {
    const db = getDb();
    const res = db.prepare("UPDATE ngo_profiles SET verification_status = ? WHERE id = ?").run(status, ngoId);
    return res.changes > 0;
  }

  static updateNgoCapacityAndPreferences(
    userId: string,
    data: {
      capacity?: number;
      currentRequirement?: number;
      preferredCategories?: string[];
      operationalHours?: string;
      contactPerson?: string;
      phone?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      organizationName?: string;
      verificationStatus?: NGOVerificationStatus;
    }
  ): NGOProfile | null {
    const db = getDb();
    const existing = this.getNgoProfileByUserId(userId);
    if (!existing) return null;

    db.transaction(() => {
      if (
        data.capacity !== undefined ||
        data.currentRequirement !== undefined ||
        data.preferredCategories !== undefined ||
        data.operationalHours !== undefined ||
        data.contactPerson !== undefined ||
        data.address !== undefined ||
        data.latitude !== undefined ||
        data.longitude !== undefined ||
        data.organizationName !== undefined ||
        data.verificationStatus !== undefined
      ) {
        db.prepare(`
          UPDATE ngo_profiles
          SET capacity = COALESCE(?, capacity),
              current_requirement = COALESCE(?, current_requirement),
              preferred_categories = COALESCE(?, preferred_categories),
              operational_hours = COALESCE(?, operational_hours),
              contact_person = COALESCE(?, contact_person),
              address = COALESCE(?, address),
              latitude = COALESCE(?, latitude),
              longitude = COALESCE(?, longitude),
              organization_name = COALESCE(?, organization_name),
              verification_status = COALESCE(?, verification_status)
          WHERE user_id = ?
        `).run(
          data.capacity !== undefined ? data.capacity : null,
          data.currentRequirement !== undefined ? data.currentRequirement : null,
          data.preferredCategories ? JSON.stringify(data.preferredCategories) : null,
          data.operationalHours || null,
          data.contactPerson || null,
          data.address || null,
          data.latitude !== undefined ? data.latitude : null,
          data.longitude !== undefined ? data.longitude : null,
          data.organizationName || null,
          data.verificationStatus || null,
          userId
        );
      }

      if (data.phone || data.contactPerson) {
        db.prepare(`
          UPDATE users
          SET phone = COALESCE(?, phone),
              name = COALESCE(?, name)
          WHERE id = ?
        `).run(data.phone || null, data.contactPerson || null, userId);
      }
    })();

    return this.getNgoProfileByUserId(userId);
  }

  /**
   * Request / Accept food donation with atomic reservation and verification enforcement
   */
  static acceptFoodDonation(data: {
    donationId: string;
    ngoUserId: string;
    requestedQuantity?: number;
  }): { success: boolean; donation: DonationItem; message: string } {
    const db = getDb();

    // 1. Check NGO Profile & Verification Status
    const ngo = this.getNgoProfileByUserId(data.ngoUserId);
    if (!ngo) {
      throw new Error("NGO Profile not found. Please log in as a registered non-profit organization.");
    }

    if (ngo.verificationStatus !== "verified") {
      throw new Error(
        `Action Restricted: Only verified NGOs can accept food donations. Your organization status is "${ngo.verificationStatus}".`
      );
    }

    // 2. Check Donation Existence & Status
    const donation = DonationRepository.getDonationById(data.donationId);
    if (!donation) {
      throw new Error("Donation not found.");
    }

    if (donation.status !== "published" && donation.status !== "available") {
      throw new Error(
        `This donation is no longer available. Current status: "${donation.status.replace("_", " ")}".`
      );
    }

    // 3. Check requested quantity
    const reqQty = data.requestedQuantity || donation.servingsEstimate;
    if (reqQty <= 0) {
      throw new Error("Requested servings must be greater than 0.");
    }
    if (reqQty > donation.servingsEstimate) {
      throw new Error(
        `Requested quantity (${reqQty}) exceeds available portions (${donation.servingsEstimate}).`
      );
    }

    // 4. Atomic claim update (prevents multiple organizations from claiming the same donation)
    const updateRes = db
      .prepare(`
        UPDATE food_donations
        SET status = 'accepted'
        WHERE id = ? AND status IN ('published', 'available')
      `)
      .run(data.donationId);

    if (updateRes.changes === 0) {
      throw new Error("Conflict: This food donation was just claimed by another organization.");
    }

    // 5. Record Match & Food Request link
    db.prepare(`
      INSERT OR REPLACE INTO matches (
        id, donation_id, ngo_id, match_score, distance, urgency_score, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'accepted', CURRENT_TIMESTAMP)
    `).run(
      `match_${data.donationId}`,
      data.donationId,
      ngo.id,
      0.98,
      1.5,
      0.9
    );

    db.prepare(`
      INSERT INTO food_requests (
        id, ngo_id, donation_id, requested_quantity, status, created_at
      ) VALUES (?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
    `).run(
      `req_${Date.now()}`,
      ngo.id,
      data.donationId,
      reqQty
    );

    // 5b. Generate Available Pickup Task for Volunteers with Geographic Coordinates
    const pickupId = `pik_${data.donationId}_${Date.now()}`;
    const pLat = donation.latitude ?? 37.7915;
    const pLng = donation.longitude ?? -122.3999;
    const dLat = ngo.latitude ?? 37.7858;
    const dLng = ngo.longitude ?? -122.4042;
    const distMiles = calculateHaversineDistance(pLat, pLng, dLat, dLng, "miles");
    const distKm = calculateHaversineDistance(pLat, pLng, dLat, dLng, "km");
    const estMins = calculateTravelTimeMinutes(distKm, "Bike");

    db.prepare(`
      INSERT OR IGNORE INTO pickups (
        id, donation_id, volunteer_id, ngo_id, pickup_location, delivery_location,
        pickup_lat, pickup_lng, delivery_lat, delivery_lng,
        status, distance_miles, estimated_duration_mins
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)
    `).run(
      pickupId,
      data.donationId,
      ngo.id,
      donation.pickupAddress || "Donor Kitchen",
      ngo.address || "NGO Shelter",
      pLat,
      pLng,
      dLat,
      dLng,
      distMiles,
      estMins
    );

    // 6. Notify Donor
    NotificationRepository.createNotification({
      userId: donation.donorId,
      title: "Donation Accepted",
      message: `"${ngo.name}" has accepted your food surplus "${donation.title}". Volunteer courier dispatch in progress.`,
      type: "donation_alert",
    });

    // 7. Notify NGO
    NotificationRepository.createNotification({
      userId: data.ngoUserId,
      title: "Food Donation Claim Confirmed",
      message: `You have successfully accepted "${donation.title}" (${reqQty} portions). Courier handover is being coordinated.`,
      type: "match_found",
    });

    // 8. Broadcast to Volunteer Couriers
    const volunteers = db.prepare("SELECT user_id FROM volunteer_profiles WHERE verification_status = 'verified'").all() as any[];
    for (const v of volunteers) {
      NotificationRepository.createNotification({
        userId: v.user_id,
        title: "New Pickup Route Available",
        message: `Pickup ready: "${donation.title}" (${reqQty} portions) from ${donation.donorName} to ${ngo.name}.`,
        type: "pickup_assigned",
      });
    }

    const updated = DonationRepository.getDonationById(data.donationId)!;
    return {
      success: true,
      donation: updated,
      message: `Successfully accepted ${donation.title}! A courier is being dispatched.`,
    };
  }

  /**
   * Get live nearby available food with geographic Haversine distance calculations and radius filters
   */
  static getNearbyFood(filter?: {
    category?: string;
    maxDistanceMiles?: number;
    radiusKm?: number;
    minQuantity?: number;
    maxHoursRemaining?: number;
    ngoLat?: number;
    ngoLng?: number;
    ngoUserId?: string;
  }): Array<DonationItem & { distanceMiles: number; distanceKm: number; estimatedDurationMins: number; urgencyLevel: "urgent" | "standard" }> {
    DonationRepository.checkAndExpireOverdueDonations();

    const db = getDb();

    // Determine reference NGO coordinates for Haversine calculations
    let centerLat = filter?.ngoLat;
    let centerLng = filter?.ngoLng;

    if ((centerLat === undefined || centerLng === undefined) && filter?.ngoUserId) {
      const ngo = this.getNgoProfileByUserId(filter.ngoUserId);
      if (ngo?.latitude && ngo?.longitude) {
        centerLat = ngo.latitude;
        centerLng = ngo.longitude;
      }
    }

    // Default reference coordinate is San Francisco central shelter hub if unknown
    const refLat = centerLat ?? 37.7858;
    const refLng = centerLng ?? -122.4042;

    let sql = `
      SELECT fd.*,
             dp.user_id as donor_user_id,
             dp.organization_name as donor_name,
             u.phone as donor_phone,
             u.name as donor_rep_name
      FROM food_donations fd
      JOIN donor_profiles dp ON fd.donor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE fd.status IN ('published', 'available')
    `;
    const params: any[] = [];

    if (filter?.category && filter.category !== "all" && filter.category !== "All") {
      sql += " AND LOWER(fd.category) = LOWER(?)";
      params.push(filter.category);
    }

    if (filter?.minQuantity) {
      sql += " AND fd.servings >= ?";
      params.push(filter.minQuantity);
    }

    sql += " ORDER BY fd.available_until ASC";

    const rows = db.prepare(sql).all(...params) as any[];

    // Calculate real geographic Haversine distance and travel time
    const items = rows
      .map((r) => {
        const itemLat = r.latitude ?? 37.7915;
        const itemLng = r.longitude ?? -122.3999;

        const distKm = calculateHaversineDistance(refLat, refLng, itemLat, itemLng, "km");
        const distMiles = calculateHaversineDistance(refLat, refLng, itemLat, itemLng, "miles");
        const estDuration = calculateTravelTimeMinutes(distKm, "Bike");

        const expiresMs = new Date(r.available_until).getTime();
        const diffHours = (expiresMs - Date.now()) / (1000 * 3600);
        const urgencyLevel: "urgent" | "standard" = diffHours <= 2 ? "urgent" : "standard";

        let allergens: string[] = [];
        try {
          allergens = r.allergens ? JSON.parse(r.allergens) : [];
        } catch {
          allergens = r.allergens ? [r.allergens] : [];
        }

        const item: DonationItem & {
          distanceMiles: number;
          distanceKm: number;
          estimatedDurationMins: number;
          urgencyLevel: "urgent" | "standard";
        } = {
          id: r.id,
          donorId: r.donor_user_id,
          donorName: r.donor_name || "Green Leaf Bistro",
          donorCategory: "Restaurant",
          donorPhone: r.donor_phone || "+1 (555) 234-8901",
          title: r.food_name,
          description: r.description || "",
          foodType: r.category as any,
          quantity: r.quantity,
          unit: "servings",
          servingsEstimate: r.servings,
          perishableHours: 4,
          preparationTime: r.preparation_time,
          preparedAt: r.preparation_time,
          availableUntil: r.available_until,
          expiresAt: r.available_until,
          storageMethod: r.storage_method || "Room Temperature",
          dietaryInfo: allergens,
          allergens,
          imageUrl: r.image_url || undefined,
          pickupAddress: {
            street: r.pickup_address,
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
          },
          latitude: itemLat,
          longitude: itemLng,
          status: r.status as DonationStatus,
          createdAt: r.created_at,
          distanceMiles: distMiles,
          distanceKm: distKm,
          estimatedDurationMins: estDuration,
          urgencyLevel,
        };

        return item;
      })
      .filter((item) => {
        if (filter?.radiusKm && item.distanceKm > filter.radiusKm) {
          return false;
        }
        if (filter?.maxDistanceMiles && item.distanceMiles > filter.maxDistanceMiles) {
          return false;
        }
        if (filter?.maxHoursRemaining) {
          const diffHours = (new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 3600);
          if (diffHours > filter.maxHoursRemaining) return false;
        }
        return true;
      });

    // Sort by closest distance
    return items.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Get active inbound accepted donations for an NGO
   */
  static getAcceptedDonations(ngoUserId: string): DonationItem[] {
    const db = getDb();
    const ngo = this.getNgoProfileByUserId(ngoUserId);
    if (!ngo) return [];

    const rows = db
      .prepare(`
        SELECT fd.*,
               dp.user_id as donor_user_id,
               dp.organization_name as donor_name,
               u.phone as donor_phone,
               p.id as pickup_id,
               p.status as pickup_status,
               vu.name as assigned_volunteer_name,
               vu.phone as assigned_volunteer_phone
        FROM matches m
        JOIN food_donations fd ON m.donation_id = fd.id
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        JOIN users u ON dp.user_id = u.id
        LEFT JOIN pickups p ON fd.id = p.donation_id
        LEFT JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
        LEFT JOIN users vu ON vp.user_id = vu.id
        WHERE m.ngo_id = ?
          AND fd.status IN ('matched', 'accepted', 'pickup_assigned', 'in_transit', 'picked_up')
        ORDER BY fd.created_at DESC
      `)
      .all(ngo.id) as any[];

    return rows.map((r) => ({
      id: r.id,
      donorId: r.donor_user_id,
      donorName: r.donor_name || "Green Leaf Bistro",
      donorCategory: "Restaurant",
      donorPhone: r.donor_phone,
      title: r.food_name,
      description: r.description || "",
      foodType: r.category as any,
      quantity: r.quantity,
      unit: "servings",
      servingsEstimate: r.servings,
      perishableHours: 4,
      expiresAt: r.available_until,
      availableUntil: r.available_until,
      storageMethod: r.storage_method,
      pickupAddress: {
        street: r.pickup_address,
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
      },
      status: r.status as DonationStatus,
      assignedVolunteerName: r.assigned_volunteer_name,
      assignedVolunteerPhone: r.assigned_volunteer_phone,
      createdAt: r.created_at,
    }));
  }

  /**
   * Get completed historical deliveries for an NGO
   */
  static getCompletedDonations(ngoUserId: string): DonationItem[] {
    const db = getDb();
    const ngo = this.getNgoProfileByUserId(ngoUserId);
    if (!ngo) return [];

    const rows = db
      .prepare(`
        SELECT fd.*,
               dp.user_id as donor_user_id,
               dp.organization_name as donor_name,
               u.phone as donor_phone,
               p.delivered_at as pickup_delivered_at,
               vu.name as assigned_volunteer_name
        FROM matches m
        JOIN food_donations fd ON m.donation_id = fd.id
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        JOIN users u ON dp.user_id = u.id
        LEFT JOIN pickups p ON fd.id = p.donation_id
        LEFT JOIN volunteer_profiles vp ON p.volunteer_id = vp.id
        LEFT JOIN users vu ON vp.user_id = vu.id
        WHERE m.ngo_id = ?
          AND fd.status IN ('delivered', 'completed')
        ORDER BY fd.created_at DESC
      `)
      .all(ngo.id) as any[];

    return rows.map((r) => ({
      id: r.id,
      donorId: r.donor_user_id,
      donorName: r.donor_name || "Green Leaf Bistro",
      donorCategory: "Restaurant",
      donorPhone: r.donor_phone,
      title: r.food_name,
      description: r.description || "",
      foodType: r.category as any,
      quantity: r.quantity,
      unit: "servings",
      servingsEstimate: r.servings,
      perishableHours: 4,
      expiresAt: r.available_until,
      availableUntil: r.available_until,
      storageMethod: r.storage_method,
      pickupAddress: {
        street: r.pickup_address,
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
      },
      status: r.status as DonationStatus,
      assignedVolunteerName: r.assigned_volunteer_name,
      createdAt: r.created_at,
      completedAt: r.pickup_delivered_at || r.created_at,
    }));
  }

  static createFoodRequest(data: {
    id?: string;
    ngoId?: string;
    ngoUserId?: string;
    foodTypeNeeded: string;
    servingsRequired: number;
    urgency: string;
    neededBy: string;
    location: string;
    notes?: string;
  }): FoodRequest {
    const db = getDb();
    const id = data.id || `req_${Date.now()}`;

    let ngoId = data.ngoId;
    let ngoName = "Hope Kitchen & Shelter";
    if (!ngoId && data.ngoUserId) {
      const ngo = this.getNgoProfileByUserId(data.ngoUserId);
      if (ngo) {
        ngoId = ngo.id;
        ngoName = ngo.name;
      }
    }
    if (!ngoId) ngoId = "ngo_prof_1";

    db.prepare(`
      INSERT INTO food_requests (id, ngo_id, requested_quantity, status, created_at)
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).run(id, ngoId, data.servingsRequired);

    return {
      id,
      ngoId,
      ngoName,
      foodTypeNeeded: data.foodTypeNeeded,
      servingsRequired: data.servingsRequired,
      urgency: (data.urgency === "urgent" ? "urgent" : "standard") as any,
      neededBy: data.neededBy,
      location: data.location,
      status: "open",
      createdAt: new Date().toISOString(),
      notes: data.notes,
    };
  }

  static getFoodRequests(ngoUserId?: string): FoodRequest[] {
    const db = getDb();
    let sql = `
      SELECT fr.*, np.organization_name as ngo_name, np.address as ngo_address
      FROM food_requests fr
      JOIN ngo_profiles np ON fr.ngo_id = np.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (ngoUserId) {
      sql += " AND np.user_id = ?";
      params.push(ngoUserId);
    }
    sql += " ORDER BY fr.created_at DESC";

    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      ngoId: r.ngo_id,
      ngoName: r.ngo_name,
      foodTypeNeeded: "Prepared Cooked Meals",
      servingsRequired: r.requested_quantity,
      urgency: "urgent",
      neededBy: "Today, Evening Dinner",
      location: r.ngo_address,
      status: r.status === "pending" ? "open" : (r.status as any),
      createdAt: r.created_at,
    }));
  }

  static getNGOStats(ngoUserId: string) {
    const db = getDb();
    const ngo = this.getNgoProfileByUserId(ngoUserId);

    const availableNearbyCount = db
      .prepare("SELECT COUNT(*) as count FROM food_donations WHERE status IN ('published', 'available')")
      .get() as { count: number };

    const activeRequestsCount = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM food_requests fr
        JOIN ngo_profiles np ON fr.ngo_id = np.id
        WHERE np.user_id = ? AND fr.status = 'pending'
      `)
      .get(ngoUserId) as { count: number };

    const acceptedItems = this.getAcceptedDonations(ngoUserId);
    const completedItems = this.getCompletedDonations(ngoUserId);

    const mealsReceived = completedItems.reduce((acc, curr) => acc + (curr.servingsEstimate || 0), 0);

    // Recent activity combining accepted, delivered, and requests
    const recentActivity = [
      ...acceptedItems.map((item) => ({
        id: item.id,
        type: "accepted",
        title: item.title,
        status: item.status,
        servings: item.servingsEstimate,
        date: item.createdAt,
      })),
      ...completedItems.map((item) => ({
        id: item.id,
        type: "delivered",
        title: item.title,
        status: "delivered",
        servings: item.servingsEstimate,
        date: item.completedAt || item.createdAt,
      })),
    ].slice(0, 6);

    return {
      availableNearbyFood: availableNearbyCount.count,
      activeRequests: activeRequestsCount.count,
      acceptedDonations: acceptedItems.length,
      completedDonations: completedItems.length,
      mealsReceived,
      recentActivity,
      verificationStatus: ngo?.verificationStatus || "pending",
      capacityPerDay: ngo?.capacityPerDay || 100,
      currentRequirement: ngo?.currentRequirement || 50,
    };
  }

  private static mapRowToNgoProfile(row: any): NGOProfile {
    let prefs: string[] = ["Cooked meals", "Rice", "Bread/roti"];
    try {
      if (row.preferred_categories) {
        prefs = JSON.parse(row.preferred_categories);
      }
    } catch {
      prefs = row.preferred_categories ? [row.preferred_categories] : prefs;
    }

    return {
      id: row.id,
      userId: row.user_id,
      name: row.organization_name,
      organizationName: row.organization_name,
      registrationNumber: row.registration_number || "NGO-501C3-88204",
      verificationStatus: row.verification_status,
      contactPerson: row.contact_person,
      phone: row.phone,
      email: row.email,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      city: "San Francisco",
      capacityPerDay: row.capacity || 100,
      currentRequirement: row.current_requirement || 50,
      currentBeneficiaries: Math.round((row.capacity || 100) * 0.8),
      operationalHours: row.operational_hours || "7:00 AM - 9:00 PM",
      foodPreferences: prefs,
      documentsSubmitted: ["501c3_Tax_Exemption.pdf", "Kitchen_Health_Inspection.pdf"],
      verifiedAt: row.verification_status === "verified" ? "2024-01-01T00:00:00Z" : undefined,
      description: row.description || "",
    };
  }
}
