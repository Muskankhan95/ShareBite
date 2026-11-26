import { NextRequest, NextResponse } from "next/server";
import { NGORepository } from "@/lib/db/repositories/ngo.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || user?.userId || "usr_ngo_1";

    const stats = NGORepository.getNGOStats(userId);
    return NextResponse.json({ stats }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
