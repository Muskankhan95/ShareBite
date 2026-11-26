import { NextRequest, NextResponse } from "next/server";
import { AdminRepository } from "@/lib/db/repositories/admin.repo";
import { requireAdmin } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const details = AdminRepository.getUserDetails(userId);
      if (!details) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ details }, { status: 200 });
    }

    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;

    const users = AdminRepository.getAllUsers({ search, role, status });
    return NextResponse.json({ users }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const body = await req.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status are required." }, { status: 400 });
    }

    if (status !== "active" && status !== "suspended") {
      return NextResponse.json({ error: "Status must be 'active' or 'suspended'." }, { status: 400 });
    }

    const success = AdminRepository.setUserStatus(userId, status, guard.userId);
    return NextResponse.json({
      success,
      message: `User status successfully updated to "${status}".`,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user status." }, { status: 400 });
  }
}
