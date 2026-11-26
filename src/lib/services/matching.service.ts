import {
  NGOMatchResult,
  VolunteerMatchResult,
  MatchingWeights,
  DEFAULT_MATCHING_WEIGHTS,
  UrgencyThresholds,
  DEFAULT_URGENCY_THRESHOLDS,
} from "@/lib/matching/types";
import {
  rankNgosForDonation,
  rankVolunteersForPickup,
  DonationForMatching,
  NGOForMatching,
  VolunteerForMatching,
} from "@/lib/matching/matching-engine";

export class MatchingService {
  /**
   * Calculate ranked, explainable NGO matches for a donation.
   * Runs server-side or proxies through API when on browser client.
   */
  async getNgoMatches(
    donationId: string,
    customWeights?: Partial<MatchingWeights>,
    customThresholds?: Partial<UrgencyThresholds>
  ): Promise<NGOMatchResult[]> {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams({ donationId });
      if (customWeights?.distance) params.append("w_dist", String(customWeights.distance));
      if (customWeights?.urgency) params.append("w_urg", String(customWeights.urgency));
      if (customWeights?.capacity) params.append("w_cap", String(customWeights.capacity));
      if (customWeights?.preference) params.append("w_pref", String(customWeights.preference));
      if (customWeights?.availability) params.append("w_avail", String(customWeights.availability));

      const res = await fetch(`/api/matching/ngos?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to calculate NGO matches");
      }
      const data = await res.json();
      return data.matches || [];
    }

    // Server-side direct repository calculation
    const { getDb } = require("@/lib/db");
    const { MatchRepository } = require("@/lib/db/repositories/match.repo");
    const db = getDb();

    // 1. Fetch donation
    const donationRow = db
      .prepare(`
        SELECT fd.*, dp.organization_name as donor_org_name
        FROM food_donations fd
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        WHERE fd.id = ?
      `)
      .get(donationId) as any;

    if (!donationRow) {
      throw new Error(`Food donation '${donationId}' not found`);
    }

    let dietaryTags: string[] = [];
    try {
      dietaryTags = JSON.parse(donationRow.allergens || "[]");
    } catch {
      if (donationRow.allergens) dietaryTags = [donationRow.allergens];
    }

    const donation: DonationForMatching = {
      id: donationRow.id,
      foodName: donationRow.food_name,
      category: donationRow.category,
      quantity: Number(donationRow.quantity) || 1,
      servings: Number(donationRow.servings) || 10,
      availableUntil: donationRow.available_until,
      preparationTime: donationRow.preparation_time,
      storageMethod: donationRow.storage_method,
      dietaryTags,
      pickupAddress: donationRow.pickup_address,
      latitude: donationRow.latitude,
      longitude: donationRow.longitude,
    };

    // 2. Fetch all verified NGOs
    const ngoRows = db
      .prepare(`
        SELECT np.*, u.phone as ngo_phone
        FROM ngo_profiles np
        JOIN users u ON np.user_id = u.id
        WHERE u.status = 'active'
      `)
      .all() as any[];

    const ngos: NGOForMatching[] = ngoRows.map((r) => {
      let preferredCategories: string[] = [];
      try {
        preferredCategories = JSON.parse(r.preferred_categories || "[]");
      } catch {
        preferredCategories = ["Cooked meals", "Rice", "Bread/roti"];
      }

      return {
        id: r.id,
        organizationName: r.organization_name,
        contactPerson: r.contact_person,
        phone: r.ngo_phone || "",
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        verificationStatus: r.verification_status,
        capacity: Number(r.capacity) || 50,
        currentRequirement: Number(r.current_requirement) || 30,
        preferredCategories,
        operationalHours: r.operational_hours,
      };
    });

    const activeWeights: MatchingWeights = {
      ...DEFAULT_MATCHING_WEIGHTS,
      ...customWeights,
    };

    const activeThresholds: UrgencyThresholds = {
      ...DEFAULT_URGENCY_THRESHOLDS,
      ...customThresholds,
    };

    // 3. Compute ranked matches with explainability
    const rankedMatches = rankNgosForDonation(
      donation,
      ngos,
      activeWeights,
      activeThresholds
    );

    // 4. Save top matches to database for persistence
    try {
      MatchRepository.saveBatchMatches(rankedMatches.slice(0, 10));
    } catch (e) {
      console.warn("Could not persist matches to DB:", e);
    }

    return rankedMatches;
  }

  /**
   * Calculate ranked, explainable volunteer matches for an accepted pickup mission.
   */
  async getVolunteerMatches(pickupId: string): Promise<VolunteerMatchResult[]> {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/matching/volunteers?pickupId=${encodeURIComponent(pickupId)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch volunteer matches");
      }
      const data = await res.json();
      return data.matches || [];
    }

    const { getDb } = require("@/lib/db");
    const db = getDb();

    // 1. Fetch pickup coordinates
    const pickup = db
      .prepare(`
        SELECT p.*, fd.latitude as fd_lat, fd.longitude as fd_lng
        FROM pickups p
        JOIN food_donations fd ON p.donation_id = fd.id
        WHERE p.id = ?
      `)
      .get(pickupId) as any;

    if (!pickup) {
      throw new Error(`Pickup task '${pickupId}' not found`);
    }

    const pickupLat = pickup.pickup_lat ?? pickup.fd_lat ?? 37.7749;
    const pickupLng = pickup.pickup_lng ?? pickup.fd_lng ?? -122.4194;

    // 2. Fetch volunteers and their active delivery loads
    const volRows = db
      .prepare(`
        SELECT vp.*, u.name as vol_name, u.phone as vol_phone,
               (SELECT COUNT(*) FROM pickups p2 
                WHERE p2.volunteer_id = vp.id 
                  AND p2.status IN ('accepted', 'assigned', 'at_pickup', 'picked_up', 'in_transit')
               ) as active_pickups_count,
               (SELECT COUNT(*) FROM pickups p3 
                WHERE p3.volunteer_id = vp.id 
                  AND p3.status IN ('delivered', 'completed')
               ) as completed_trips_count
        FROM volunteer_profiles vp
        JOIN users u ON vp.user_id = u.id
        WHERE u.status = 'active'
      `)
      .all() as any[];

    const volunteers: VolunteerForMatching[] = volRows.map((r) => ({
      id: r.id,
      name: r.vol_name,
      phone: r.vol_phone,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      vehicleType: r.vehicle_type || "Bike",
      availabilityStatus: r.availability_status || "available",
      verificationStatus: r.verification_status || "verified",
      activePickupsCount: Number(r.active_pickups_count) || 0,
      completedTripsCount: Number(r.completed_trips_count) || 0,
    }));

    return rankVolunteersForPickup(volunteers, pickupLat, pickupLng, pickup.urgency || "standard");
  }

  /**
   * Concurrency-safe assignment of a recommended volunteer to a pickup
   */
  async assignVolunteer(
    pickupId: string,
    volunteerProfileId: string
  ): Promise<{ success: boolean; message: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/matching/assign-volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupId, volunteerProfileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign volunteer");
      }
      return data;
    }

    const { getDb } = require("@/lib/db");
    const db = getDb();

    // 1. Verify volunteer has 0 active pickups
    const activeCheck = db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM pickups 
        WHERE volunteer_id = ? 
          AND status IN ('accepted', 'assigned', 'at_pickup', 'picked_up', 'in_transit')
      `)
      .get(volunteerProfileId) as { count: number };

    if (activeCheck && activeCheck.count > 0) {
      throw new Error(
        "Assignment Rejected: This volunteer is already engaged in an active pickup delivery."
      );
    }

    // 2. Fetch volunteer profile details
    const vol = db
      .prepare("SELECT * FROM volunteer_profiles WHERE id = ?")
      .get(volunteerProfileId) as any;

    if (!vol) {
      throw new Error("Volunteer profile not found");
    }

    if (vol.verification_status !== "verified") {
      throw new Error("Assignment Rejected: Only verified volunteers can be assigned.");
    }

    if (vol.availability_status !== "available") {
      throw new Error("Assignment Rejected: Volunteer is currently marked as unavailable.");
    }

    // 3. Atomically assign pickup
    const updateResult = db
      .prepare(`
        UPDATE pickups
        SET volunteer_id = ?,
            status = 'assigned',
            accepted_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND (volunteer_id IS NULL OR status IN ('available', 'pending'))
      `)
      .run(volunteerProfileId, pickupId);

    if (updateResult.changes === 0) {
      throw new Error("Conflict: Pickup has already been assigned to another courier.");
    }

    // 4. Update donation status
    const pickup = db.prepare("SELECT donation_id FROM pickups WHERE id = ?").get(pickupId) as any;
    if (pickup?.donation_id) {
      db.prepare(`
        UPDATE food_donations
        SET status = 'pickup_assigned'
        WHERE id = ?
      `).run(pickup.donation_id);
    }

    // 5. Send notification to volunteer
    try {
      const notifId = `notif_${Date.now()}`;
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read_status, created_at)
        VALUES (?, ?, 'New Mission Assigned', 'You have been matched and assigned to a new food rescue pickup mission.', 'pickup_assigned', 0, CURRENT_TIMESTAMP)
      `).run(notifId, vol.user_id);
    } catch {
      // ignore
    }

    return {
      success: true,
      message: "Volunteer courier successfully matched and assigned to pickup mission.",
    };
  }
}

export const matchingService = new MatchingService();
