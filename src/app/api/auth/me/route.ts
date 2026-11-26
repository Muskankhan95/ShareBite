import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";
import { findUserById, sanitizeUser } from "@/lib/db/user-store";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = findUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: sanitizeUser(user) }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
