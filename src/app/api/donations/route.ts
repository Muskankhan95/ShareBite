import { NextRequest, NextResponse } from "next/server";
import { DonationRepository } from "@/lib/db/repositories/donation.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donorId") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const statsOnly = searchParams.get("stats") === "true";

    if (statsOnly && donorId) {
      const stats = DonationRepository.getDonorStats(donorId);
      return NextResponse.json({ stats }, { status: 200 });
    }

    const donations = DonationRepository.getDonations({
      donorUserId: donorId,
      status,
      category,
    });

    return NextResponse.json({ donations }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve donations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const donorUserId = user?.userId || body.donorUserId || "usr_donor_1";

    // 1. Required field checks
    if (!body.foodName || typeof body.foodName !== "string" || !body.foodName.trim()) {
      return NextResponse.json({ error: "Food name is required." }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: "Food category is required." }, { status: 400 });
    }
    if (!body.pickupAddress || typeof body.pickupAddress !== "string" || !body.pickupAddress.trim()) {
      return NextResponse.json({ error: "Pickup address is required." }, { status: 400 });
    }
    if (!body.availableUntil) {
      return NextResponse.json({ error: "Available-until expiration date/time is required." }, { status: 400 });
    }

    // 2. Quantity & Serving validation (prevent negative/zero)
    const quantity = Number(body.quantity);
    const servings = Number(body.servings);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number greater than 0." }, { status: 400 });
    }
    if (isNaN(servings) || servings <= 0) {
      return NextResponse.json({ error: "Number of servings must be a positive integer greater than 0." }, { status: 400 });
    }

    // 3. Date ordering and validity validation
    const prepDateMs = body.preparationTime ? new Date(body.preparationTime).getTime() : Date.now();
    const availUntilMs = new Date(body.availableUntil).getTime();

    if (isNaN(availUntilMs)) {
      return NextResponse.json({ error: "Invalid date format for available-until." }, { status: 400 });
    }
    if (body.preparationTime && isNaN(prepDateMs)) {
      return NextResponse.json({ error: "Invalid date format for preparation time." }, { status: 400 });
    }
    if (availUntilMs <= prepDateMs) {
      return NextResponse.json(
        { error: "Available-until time must be later than the preparation time." },
        { status: 400 }
      );
    }

    // 4. Food Safety Declaration confirmation
    const isDraft = body.status === "draft";
    if (!isDraft && body.safetyConfirmed !== true) {
      return NextResponse.json(
        { error: "You must confirm the food safety declaration before publishing your donation." },
        { status: 400 }
      );
    }

    const created = DonationRepository.createDonation({
      donorUserId,
      foodName: body.foodName,
      description: body.description || "",
      category: body.category,
      quantity,
      unit: body.unit || "servings",
      servings,
      preparationTime: body.preparationTime,
      availableUntil: body.availableUntil,
      storageMethod: body.storageMethod,
      allergens: Array.isArray(body.allergens) ? body.allergens : [],
      imageUrl: body.imageUrl,
      pickupAddress: body.pickupAddress,
      latitude: body.latitude,
      longitude: body.longitude,
      specialInstructions: body.specialInstructions,
      status: isDraft ? "draft" : "published",
      safetyConfirmed: body.safetyConfirmed === true,
    });

    return NextResponse.json({ donation: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create donation" }, { status: 500 });
  }
}
