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
    return NextResponse.json({
      availabilityStatus: profile.availabilityStatus,
      verificationStatus: profile.verificationStatus,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch availability" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const volunteerUserId = user?.userId || body.volunteerUserId || "usr_vol_1";
    const { availabilityStatus } = body;

    if (!availabilityStatus || (availabilityStatus !== "available" && availabilityStatus !== "unavailable")) {
      return NextResponse.json({ error: "Invalid availability status. Must be 'available' or 'unavailable'." }, { status: 400 });
    }

    const updated = VolunteerRepository.setAvailability(volunteerUserId, availabilityStatus);
    return NextResponse.json({
      success: true,
      availabilityStatus: updated.availabilityStatus,
      message: `Your status has been updated to "${updated.availabilityStatus}".`,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update availability" }, { status: 500 });
  }
}
