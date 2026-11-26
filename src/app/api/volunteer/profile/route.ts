import { NextRequest, NextResponse } from "next/server";
import { VolunteerRepository } from "@/lib/db/repositories/volunteer.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const { searchParams } = new URL(req.url);
    const volunteerUserId = searchParams.get("volunteerId") || user?.userId || "usr_vol_1";

    const profile = VolunteerRepository.getVolunteerProfileByUserId(volunteerUserId);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const volunteerUserId = user?.userId || body.volunteerUserId || "usr_vol_1";

    const updated = VolunteerRepository.updateVolunteerProfile(volunteerUserId, {
      address: body.address,
      latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
      longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
      vehicleType: body.vehicleType,
      preferredRadius: body.preferredRadius ? parseInt(body.preferredRadius, 10) : undefined,
      availabilityStatus: body.availabilityStatus,
    });

    return NextResponse.json({
      success: true,
      profile: updated,
      message: "Profile updated successfully.",
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
