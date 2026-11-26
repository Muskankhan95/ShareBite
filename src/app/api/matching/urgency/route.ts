import { NextRequest, NextResponse } from "next/server";
import { predictDonationUrgency } from "@/lib/matching/urgency";

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

    const { getDb } = require("@/lib/db");
    const db = getDb();

    const donationRow = db
      .prepare(`
        SELECT fd.*, dp.latitude as dp_lat, dp.longitude as dp_lng
        FROM food_donations fd
        JOIN donor_profiles dp ON fd.donor_id = dp.id
        WHERE fd.id = ?
      `)
      .get(donationId) as any;

    if (!donationRow) {
      return NextResponse.json(
        { error: `Donation with ID '${donationId}' not found` },
        { status: 404 }
      );
    }

    // Fetch suitable nearby NGOs
    const ngos = db
      .prepare(`
        SELECT np.latitude, np.longitude, np.capacity, np.verification_status
        FROM ngo_profiles np
        JOIN users u ON np.user_id = u.id
        WHERE np.verification_status = 'verified' AND u.status = 'active'
      `)
      .all() as any[];

    const result = predictDonationUrgency({
      availableUntil: donationRow.available_until,
      preparationTime: donationRow.preparation_time,
      foodCategory: donationRow.category,
      storageMethod: donationRow.storage_method,
      quantity: Number(donationRow.quantity) || 1,
      servings: Number(donationRow.servings) || 10,
      pickupLat: donationRow.latitude ?? donationRow.dp_lat,
      pickupLng: donationRow.longitude ?? donationRow.dp_lng,
      suitableNgos: ngos,
    });

    return NextResponse.json({
      success: true,
      donationId,
      prediction: result,
    });
  } catch (err: any) {
    console.error("Urgency prediction API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to predict urgency" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = predictDonationUrgency({
      availableUntil: body.availableUntil,
      preparationTime: body.preparationTime,
      foodCategory: body.foodCategory,
      storageMethod: body.storageMethod,
      quantity: body.quantity,
      servings: body.servings,
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      suitableNgos: body.suitableNgos,
      thresholds: body.thresholds,
    });

    return NextResponse.json({
      success: true,
      prediction: result,
    });
  } catch (err: any) {
    console.error("Urgency calculation POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate urgency" },
      { status: 400 }
    );
  }
}
