import { NextRequest, NextResponse } from "next/server";
import { VolunteerRepository } from "@/lib/db/repositories/volunteer.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const volunteerUserId = searchParams.get("volunteerId");
    const category = searchParams.get("category") || undefined;
    const urgency = searchParams.get("urgency") || undefined;
    const status = searchParams.get("status") || undefined;
    const maxDistanceStr = searchParams.get("maxDistance");
    const maxDistance = maxDistanceStr ? parseFloat(maxDistanceStr) : undefined;

    if (volunteerUserId) {
      const pickups = VolunteerRepository.getMyPickups(volunteerUserId, status);
      return NextResponse.json({ pickups }, { status: 200 });
    }

    const pickups = VolunteerRepository.getAvailablePickups({
      category,
      urgency,
      maxDistance,
    });

    return NextResponse.json({ pickups }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch pickups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const {
      pickupId,
      action,
      status,
      verificationNotes,
      tempC,
      photoUrl,
      recipientName,
      digitalSignature,
    } = body;

    const volunteerUserId = user?.userId || body.volunteerUserId || "usr_vol_1";

    if (!pickupId) {
      return NextResponse.json({ error: "pickupId is required" }, { status: 400 });
    }

    if (action === "claim") {
      try {
        const result = VolunteerRepository.claimPickup(pickupId, volunteerUserId);
        return NextResponse.json(result, { status: 200 });
      } catch (err: any) {
        const isConflict = err.message?.includes("Conflict") || err.message?.includes("already been accepted");
        const isUnavailable = err.message?.includes("Unavailable") || err.message?.includes("Only verified");
        return NextResponse.json(
          { error: err.message },
          { status: isConflict ? 409 : isUnavailable ? 403 : 400 }
        );
      }
    }

    if (status) {
      try {
        const result = VolunteerRepository.updatePickupLifecycle({
          pickupId,
          volunteerUserId,
          status,
          verificationNotes,
          tempC,
          photoUrl,
          recipientName,
          digitalSignature,
        });
        return NextResponse.json(result, { status: 200 });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "No action or status specified." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
