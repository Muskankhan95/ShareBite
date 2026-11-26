import { NextRequest, NextResponse } from "next/server";
import { NGORepository } from "@/lib/db/repositories/ngo.repo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ngoId = searchParams.get("ngoId") || undefined;
    const requests = NGORepository.getFoodRequests(ngoId);
    return NextResponse.json({ requests }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.foodTypeNeeded || !body.servingsRequired || !body.neededBy || !body.location) {
      return NextResponse.json(
        { error: "Required fields: foodTypeNeeded, servingsRequired, neededBy, location" },
        { status: 400 }
      );
    }

    const created = NGORepository.createFoodRequest({
      ngoUserId: body.ngoUserId || "usr_ngo_1",
      foodTypeNeeded: body.foodTypeNeeded,
      servingsRequired: Number(body.servingsRequired),
      urgency: body.urgency || "standard",
      neededBy: body.neededBy,
      location: body.location,
      notes: body.notes,
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
