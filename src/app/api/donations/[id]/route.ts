import { NextRequest, NextResponse } from "next/server";
import { DonationRepository } from "@/lib/db/repositories/donation.repo";
import { DonationStatus } from "@/types/donation";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const donation = DonationRepository.getDonationById(params.id);
    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }
    return NextResponse.json({ donation }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, action } = body;

    const existing = DonationRepository.getDonationById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (action === "advance") {
      // Step sequentially through the lifecycle
      const sequence: DonationStatus[] = [
        "draft",
        "published",
        "matched",
        "accepted",
        "pickup_assigned",
        "picked_up",
        "delivered",
        "completed",
      ];
      const currentIndex = sequence.indexOf(existing.status);
      if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
        const nextStatus = sequence[currentIndex + 1];
        const updated = DonationRepository.advanceLifecycle(params.id, nextStatus);
        return NextResponse.json({ donation: updated, message: `Advanced to ${nextStatus}` }, { status: 200 });
      } else {
        return NextResponse.json({ donation: existing, message: "Donation is at final state or non-sequential" }, { status: 200 });
      }
    }

    if (action === "cancel") {
      if (["picked_up", "delivered", "completed"].includes(existing.status)) {
        return NextResponse.json({ error: "Cannot cancel a donation that has already been picked up or completed." }, { status: 400 });
      }
      DonationRepository.updateDonationStatus(params.id, "cancelled");
      const updated = DonationRepository.getDonationById(params.id);
      return NextResponse.json({ donation: updated, message: "Donation cancelled successfully." }, { status: 200 });
    }

    if (action === "edit" || body.foodName || body.quantity || body.servings || body.description) {
      const updated = DonationRepository.updateDonationDetails(params.id, {
        foodName: body.foodName,
        description: body.description,
        category: body.category,
        quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
        servings: body.servings !== undefined ? Number(body.servings) : undefined,
        preparationTime: body.preparationTime,
        availableUntil: body.availableUntil,
        storageMethod: body.storageMethod,
        allergens: body.allergens,
        imageUrl: body.imageUrl,
        pickupAddress: body.pickupAddress,
        latitude: body.latitude,
        longitude: body.longitude,
        specialInstructions: body.specialInstructions,
      });
      return NextResponse.json(
        { donation: updated, message: "Donation details updated successfully." },
        { status: 200 }
      );
    }

    if (!status) {
      return NextResponse.json({ error: "Status or valid action is required." }, { status: 400 });
    }

    const updated = DonationRepository.advanceLifecycle(params.id, status as DonationStatus);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update donation status." }, { status: 400 });
    }

    return NextResponse.json({ donation: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
