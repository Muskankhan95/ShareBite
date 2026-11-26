import { NextRequest, NextResponse } from "next/server";
import { AdminRepository } from "@/lib/db/repositories/admin.repo";
import { requireAdmin } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const stats = AdminRepository.getOverviewStats();
    return NextResponse.json({ stats }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load overview stats" }, { status: 500 });
  }
}
