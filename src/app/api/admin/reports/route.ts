import { NextRequest, NextResponse } from "next/server";
import { AdminRepository } from "@/lib/db/repositories/admin.repo";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const severity = searchParams.get("severity") || undefined;

    const reports = AdminRepository.getReports({ category, status, severity });
    return NextResponse.json({ reports }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const reporterId = user?.userId || body.reporterId || "usr_donor_1";
    const {
      reportedEntityType,
      reportedEntityId,
      reportedTitle,
      category,
      description,
      severity,
    } = body;

    if (!reportedTitle || !category || !description) {
      return NextResponse.json({ error: "Title, category, and description are required." }, { status: 400 });
    }

    const report = AdminRepository.createReport({
      reporterId,
      reportedEntityType: reportedEntityType || "other",
      reportedEntityId,
      reportedTitle,
      category,
      description,
      severity: severity || "medium",
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.authorized) return guard.response!;

  try {
    const body = await req.json();
    const { reportId, status, adminNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: "reportId and status are required." }, { status: 400 });
    }

    if (!["open", "investigating", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const success = AdminRepository.updateReportStatus(reportId, status, adminNotes);
    return NextResponse.json({
      success,
      message: `Report status updated to "${status}".`,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update report status." }, { status: 400 });
  }
}
