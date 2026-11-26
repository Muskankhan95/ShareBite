import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./jwt";

export async function requireAdmin(req: NextRequest): Promise<{ authorized: boolean; userId?: string; response?: NextResponse }> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Access Denied: Administrator role required." }, { status: 403 }),
    };
  }

  return { authorized: true, userId: payload.userId };
}
