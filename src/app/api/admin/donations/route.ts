import { NextRequest, NextResponse } from "next/server";
import { AdminRepository } from "@/lib/db/repositories/admin.repo";
import { requireAdmin } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const donations = AdminRepository.getAllDonations({ status, search });
    return NextResponse.json({ donations }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch donations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const body = await req.json();
    const { donationId, reason } = body;

    if (!donationId) {
      return NextResponse.json({ error: "donationId is required." }, { status: 400 });
    }

    const success = AdminRepository.cancelDonation(
      donationId,
      reason || "Cancelled by compliance administration."
    );

    return NextResponse.json({
      success,
      message: "Donation listing has been cancelled.",
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to cancel donation" }, { status: 400 });
  }
}
