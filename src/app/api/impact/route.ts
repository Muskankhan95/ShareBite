import { NextResponse } from "next/server";
import { ImpactRepository } from "@/lib/db/repositories/impact.repo";

export async function GET() {
  try {
    const stats = ImpactRepository.getImpactStatistics();
    return NextResponse.json({ stats }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
