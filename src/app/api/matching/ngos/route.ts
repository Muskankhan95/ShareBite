import { NextRequest, NextResponse } from "next/server";
import { matchingService } from "@/lib/services/matching.service";
import { MatchingWeights, UrgencyThresholds } from "@/lib/matching/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get("donationId");

    if (!donationId) {
      return NextResponse.json(
        { error: "donationId query parameter is required" },
        { status: 400 }
      );
    }

    // Parse optional custom weights
    const customWeights: Partial<MatchingWeights> = {};
    if (searchParams.has("w_dist")) customWeights.distance = parseFloat(searchParams.get("w_dist")!);
    if (searchParams.has("w_urg")) customWeights.urgency = parseFloat(searchParams.get("w_urg")!);
    if (searchParams.has("w_cap")) customWeights.capacity = parseFloat(searchParams.get("w_cap")!);
    if (searchParams.has("w_pref")) customWeights.preference = parseFloat(searchParams.get("w_pref")!);
    if (searchParams.has("w_avail")) customWeights.availability = parseFloat(searchParams.get("w_avail")!);

    // Parse optional custom thresholds
    const customThresholds: Partial<UrgencyThresholds> = {};
    if (searchParams.has("crit_hrs")) customThresholds.criticalHours = parseFloat(searchParams.get("crit_hrs")!);
    if (searchParams.has("high_hrs")) customThresholds.highHours = parseFloat(searchParams.get("high_hrs")!);
    if (searchParams.has("med_hrs")) customThresholds.mediumHours = parseFloat(searchParams.get("med_hrs")!);

    const matches = await matchingService.getNgoMatches(donationId, customWeights, customThresholds);

    return NextResponse.json({
      success: true,
      donationId,
      totalMatches: matches.length,
      matches,
    });
  } catch (err: any) {
    console.error("NGO matching API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate NGO matches" },
      { status: 500 }
    );
  }
}
