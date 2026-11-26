import { NextRequest, NextResponse } from "next/server";
import { NGORepository } from "@/lib/db/repositories/ngo.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || user?.userId || "usr_ngo_1";

    const profile = NGORepository.getNgoProfileByUserId(userId);
    if (!profile) {
      return NextResponse.json({ error: "NGO profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const userId = body.userId || user?.userId || "usr_ngo_1";

    const updated = NGORepository.updateNgoCapacityAndPreferences(userId, {
      capacity: body.capacity !== undefined ? Number(body.capacity) : undefined,
      currentRequirement: body.currentRequirement !== undefined ? Number(body.currentRequirement) : undefined,
      preferredCategories: body.preferredCategories,
      operationalHours: body.operationalHours,
      contactPerson: body.contactPerson,
      phone: body.phone,
      address: body.address,
      latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
      longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
      organizationName: body.organizationName,
      verificationStatus: body.verificationStatus,
    });

    if (!updated) {
      return NextResponse.json({ error: "Could not update NGO profile." }, { status: 404 });
    }

    return NextResponse.json({ profile: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
