import { NextRequest, NextResponse } from "next/server";
import { matchingService } from "@/lib/services/matching.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pickupId = searchParams.get("pickupId");

    if (!pickupId) {
      return NextResponse.json(
        { error: "pickupId query parameter is required" },
        { status: 400 }
      );
    }

    const matches = await matchingService.getVolunteerMatches(pickupId);

    return NextResponse.json({
      success: true,
      pickupId,
      totalMatches: matches.length,
      matches,
    });
  } catch (err: any) {
    console.error("Volunteer matching API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate volunteer matches" },
      { status: 500 }
    );
  }
}
