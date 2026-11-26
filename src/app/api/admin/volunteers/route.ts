import { NextRequest, NextResponse } from "next/server";
import { AdminRepository } from "@/lib/db/repositories/admin.repo";
import { requireAdmin } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const verificationStatus = searchParams.get("verificationStatus") || undefined;

    const volunteers = AdminRepository.getVolunteers({ search, status, verificationStatus });
    return NextResponse.json({ volunteers }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch volunteers" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const body = await req.json();
    const { userId, status, verificationStatus } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    if (verificationStatus) {
      AdminRepository.updateVolunteerVerification(userId, verificationStatus);
    }

    if (status) {
      AdminRepository.setUserStatus(userId, status, guard.userId);
    }

    return NextResponse.json({
      success: true,
      message: "Volunteer account updated successfully.",
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update volunteer." }, { status: 400 });
  }
}
