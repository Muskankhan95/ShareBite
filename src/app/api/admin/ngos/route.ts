import { NextRequest, NextResponse } from "next/server";
import { AdminRepository } from "@/lib/db/repositories/admin.repo";
import { requireAdmin } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const ngos = AdminRepository.getNgoApplications(status);
    return NextResponse.json({ ngos }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch NGOs" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const body = await req.json();
    const { ngoId, status, notes } = body;

    if (!ngoId || !status) {
      return NextResponse.json({ error: "ngoId and status required" }, { status: 400 });
    }

    if (!["verified", "rejected", "suspended", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const success = AdminRepository.updateNgoStatus(ngoId, status, notes);
    return NextResponse.json({
      success,
      message: `NGO verification status updated to "${status}".`,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update NGO" }, { status: 400 });
  }
}
