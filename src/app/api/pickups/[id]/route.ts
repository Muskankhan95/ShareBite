import { NextRequest, NextResponse } from "next/server";
import { VolunteerRepository } from "@/lib/db/repositories/volunteer.repo";
import {
  calculateHaversineDistance,
  calculateTravelTimeMinutes,
  generateRouteWaypoints,
} from "@/lib/utils/geo";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    if (!pickupId) {
      return NextResponse.json({ error: "Missing pickup ID" }, { status: 400 });
    }

    const pickup = VolunteerRepository.getPickupById(pickupId);
    if (!pickup) {
      return NextResponse.json({ error: "Pickup not found" }, { status: 404 });
    }

    const pLat = pickup.pickupLat ?? 37.7915;
    const pLng = pickup.pickupLng ?? -122.3999;
    const dLat = pickup.dropoffLat ?? 37.7858;
    const dLng = pickup.dropoffLng ?? -122.4042;

    const distanceKm = calculateHaversineDistance(pLat, pLng, dLat, dLng, "km");
    const distanceMiles = calculateHaversineDistance(pLat, pLng, dLat, dLng, "miles");
    const estimatedDurationMins = calculateTravelTimeMinutes(distanceKm, "Bike");

    const waypoints = generateRouteWaypoints(
      { latitude: pLat, longitude: pLng },
      { latitude: dLat, longitude: dLng }
    );

    const routeSteps = [
      {
        step: 1,
        instruction: `Collect food from ${pickup.donorName} at ${pickup.pickupAddress}`,
        type: "pickup",
        coordinates: [pLat, pLng],
      },
      {
        step: 2,
        instruction: `Transit ${distanceKm} km (${distanceMiles} mi) via urban corridor (~${estimatedDurationMins} mins)`,
        type: "transit",
        coordinates: waypoints[2],
      },
      {
        step: 3,
        instruction: `Handover portions to ${pickup.ngoName} staff at ${pickup.dropoffAddress}`,
        type: "delivery",
        coordinates: [dLat, dLng],
      },
    ];

    const enrichedPickup = {
      ...pickup,
      pickupLat: pLat,
      pickupLng: pLng,
      dropoffLat: dLat,
      dropoffLng: dLng,
      distanceKm,
      distanceMiles,
      estimatedDurationMins,
      route: {
        origin: { label: pickup.donorName, address: pickup.pickupAddress, lat: pLat, lng: pLng },
        destination: { label: pickup.ngoName, address: pickup.dropoffAddress, lat: dLat, lng: dLng },
        distanceKm,
        distanceMiles,
        estimatedDurationMins,
        waypoints,
        steps: routeSteps,
      },
    };

    return NextResponse.json({ pickup: enrichedPickup }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch pickup details" }, { status: 500 });
  }
}
