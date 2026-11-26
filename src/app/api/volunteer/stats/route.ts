import { NextRequest, NextResponse } from "next/server";
import { VolunteerRepository } from "@/lib/db/repositories/volunteer.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const { searchParams } = new URL(req.url);
    const volunteerUserId = searchParams.get("volunteerId") || user?.userId || "usr_vol_1";

    const stats = VolunteerRepository.getVolunteerStats(volunteerUserId);
    return NextResponse.json({ stats }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch volunteer statistics" }, { status: 500 });
  }
}
