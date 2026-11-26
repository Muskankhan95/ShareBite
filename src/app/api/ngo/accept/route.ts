import { NextRequest, NextResponse } from "next/server";
import { NGORepository } from "@/lib/db/repositories/ngo.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const ngoUserId = user?.userId || body.ngoUserId || "usr_ngo_1";
    const donationId = body.donationId;
    const requestedQuantity = body.requestedQuantity ? Number(body.requestedQuantity) : undefined;

    if (!donationId) {
      return NextResponse.json({ error: "donationId is required." }, { status: 400 });
    }

    const result = NGORepository.acceptFoodDonation({
      donationId,
      ngoUserId,
      requestedQuantity,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const msg = err.message || "Failed to accept food donation.";
    const status = msg.includes("Only verified NGOs") ? 403 : msg.includes("Conflict") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
