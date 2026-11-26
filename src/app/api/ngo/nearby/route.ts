import { NextRequest, NextResponse } from "next/server";
import { NGORepository } from "@/lib/db/repositories/ngo.repo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const maxDistance = searchParams.get("maxDistance") ? Number(searchParams.get("maxDistance")) : undefined;
    const radiusKm = searchParams.get("radiusKm") ? Number(searchParams.get("radiusKm")) : undefined;
    const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined;
    const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined;
    const ngoUserId = searchParams.get("ngoUserId") || undefined;
    const minQuantity = searchParams.get("minQuantity") ? Number(searchParams.get("minQuantity")) : undefined;
    const maxHoursRemaining = searchParams.get("maxHoursRemaining") ? Number(searchParams.get("maxHoursRemaining")) : undefined;

    const items = NGORepository.getNearbyFood({
      category,
      maxDistanceMiles: maxDistance,
      radiusKm,
      ngoLat: lat,
      ngoLng: lng,
      ngoUserId,
      minQuantity,
      maxHoursRemaining,
    });

    return NextResponse.json({ donations: items }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
