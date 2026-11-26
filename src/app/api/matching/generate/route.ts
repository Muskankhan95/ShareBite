import { NextRequest, NextResponse } from "next/server";
import { matchingService } from "@/lib/services/matching.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId } = body;

    if (!donationId) {
      return NextResponse.json(
        { error: "donationId is required in request body" },
        { status: 400 }
      );
    }

    const matches = await matchingService.getNgoMatches(donationId);

    return NextResponse.json({
      success: true,
      donationId,
      persistedCount: matches.length,
      matches,
    });
  } catch (err: any) {
    console.error("Match generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate matches" },
      { status: 500 }
    );
  }
}
