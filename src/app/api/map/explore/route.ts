import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DonationRepository } from "@/lib/db/repositories/donation.repo";
import {
  calculateHaversineDistance,
  sanitizeVolunteerForMap,
  isWithinRadius,
  DEFAULT_MAP_CENTER,
} from "@/lib/utils/geo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    DonationRepository.checkAndExpireOverdueDonations();

    const db = getDb();
    const { searchParams } = new URL(req.url);

    const centerLat = searchParams.get("lat") ? Number(searchParams.get("lat")) : DEFAULT_MAP_CENTER[0];
    const centerLng = searchParams.get("lng") ? Number(searchParams.get("lng")) : DEFAULT_MAP_CENTER[1];
    const radiusKm = searchParams.get("radiusKm") ? Number(searchParams.get("radiusKm")) : undefined;
    const layers = (searchParams.get("layers") || "donations,ngos,volunteers").split(",");

    const result: {
      center: [number, number];
      radiusKm?: number;
      donations: any[];
      ngos: any[];
      volunteers: any[];
    } = {
      center: [centerLat, centerLng],
      radiusKm,
      donations: [],
      ngos: [],
      volunteers: [],
    };

    // 1. Available Food Donations (🟢 Green Markers)
    if (layers.includes("donations") || layers.includes("all")) {
      const donationRows = db
        .prepare(`
          SELECT fd.id, fd.food_name, fd.category, fd.quantity, fd.servings,
                 fd.available_until, fd.storage_method, fd.pickup_address,
                 fd.latitude, fd.longitude, fd.status,
                 dp.organization_name as donor_name
          FROM food_donations fd
          JOIN donor_profiles dp ON fd.donor_id = dp.id
          WHERE fd.status IN ('published', 'available')
        `)
        .all() as any[];

      result.donations = donationRows
        .map((d) => {
          const lat = d.latitude ?? 37.7915;
          const lng = d.longitude ?? -122.3999;
          const distanceKm = calculateHaversineDistance(centerLat, centerLng, lat, lng, "km");

          const diffMs = new Date(d.available_until).getTime() - Date.now();
          const diffHrs = diffMs / (1000 * 3600);
          const urgency = diffHrs <= 2 ? "critical" : diffHrs <= 4 ? "high" : "medium";

          return {
            id: d.id,
            type: "donation",
            title: d.food_name,
            category: d.category,
            quantity: d.quantity,
            servings: d.servings,
            pickupAddress: d.pickup_address,
            donorName: d.donor_name,
            availableUntil: d.available_until,
            storageMethod: d.storage_method,
            latitude: lat,
            longitude: lng,
            distanceKm,
            urgency,
            markerColor: "emerald",
          };
        })
        .filter((d) => (radiusKm ? d.distanceKm <= radiusKm : true));
    }

    // 2. Verified NGOs (🔵 Blue Markers)
    if (layers.includes("ngos") || layers.includes("all")) {
      const ngoRows = db
        .prepare(`
          SELECT np.id, np.organization_name, np.address, np.contact_person,
                 np.capacity, np.current_requirement, np.latitude, np.longitude,
                 np.verification_status, u.phone
          FROM ngo_profiles np
          JOIN users u ON np.user_id = u.id
          WHERE np.verification_status = 'verified'
        `)
        .all() as any[];

      result.ngos = ngoRows
        .map((ngo) => {
          const lat = ngo.latitude ?? 37.7858;
          const lng = ngo.longitude ?? -122.4042;
          const distanceKm = calculateHaversineDistance(centerLat, centerLng, lat, lng, "km");

          return {
            id: ngo.id,
            type: "ngo",
            name: ngo.organization_name,
            address: ngo.address,
            contactPerson: ngo.contact_person,
            capacity: ngo.capacity,
            currentRequirement: ngo.current_requirement,
            latitude: lat,
            longitude: lng,
            distanceKm,
            markerColor: "blue",
          };
        })
        .filter((ngo) => (radiusKm ? ngo.distanceKm <= radiusKm : true));
    }

    // 3. Available Volunteers (🟠 Orange Markers with Privacy Fuzzing)
    if (layers.includes("volunteers") || layers.includes("all")) {
      const volunteerRows = db
        .prepare(`
          SELECT vp.id, vp.user_id, vp.address, vp.vehicle_type, vp.preferred_radius,
                 vp.availability_status, vp.verification_status, vp.latitude, vp.longitude,
                 u.name
          FROM volunteer_profiles vp
          JOIN users u ON vp.user_id = u.id
          WHERE vp.availability_status = 'available'
            AND vp.verification_status = 'verified'
            AND u.status = 'active'
        `)
        .all() as any[];

      result.volunteers = volunteerRows
        .map((v) => {
          const sanitized = sanitizeVolunteerForMap(v);
          const distanceKm = calculateHaversineDistance(
            centerLat,
            centerLng,
            sanitized.latitude,
            sanitized.longitude,
            "km"
          );

          return {
            ...sanitized,
            type: "volunteer",
            distanceKm,
            markerColor: "amber",
          };
        })
        .filter((v) => (radiusKm ? v.distanceKm <= radiusKm : true));
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load map data." }, { status: 500 });
  }
}
