import { NextRequest, NextResponse } from "next/server";
import { matchingService } from "@/lib/services/matching.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickupId, volunteerProfileId } = body;

    if (!pickupId || !volunteerProfileId) {
      return NextResponse.json(
        { error: "Both pickupId and volunteerProfileId are required" },
        { status: 400 }
      );
    }

    const result = await matchingService.assignVolunteer(pickupId, volunteerProfileId);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Assign volunteer error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to assign volunteer" },
      { status: 400 }
    );
  }
}
