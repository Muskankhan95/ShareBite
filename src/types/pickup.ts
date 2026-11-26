export type PickupStatus =
  | "available"
  | "pending"
  | "unassigned"
  | "accepted"
  | "assigned"
  | "at_pickup"
  | "on_the_way"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "failed";

export interface PickupTask {
  id: string;
  donationId: string;
  foodTitle: string;
  foodType: string;
  servings: number;
  weightKg?: number;
  quantity?: number;
  description?: string;
  storageMethod?: string;
  allergens?: string[];
  imageUrl?: string;
  availableUntil?: string;
  timeRemaining?: string;
  status: PickupStatus;
  volunteerId?: string;
  volunteerName?: string;
  donorName: string;
  donorPhone: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupTimeWindow?: string;
  ngoName: string;
  ngoPhone: string;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  distanceKm: number;
  distanceMiles?: number;
  estimatedDurationMins: number;
  urgency: "low" | "medium" | "high" | "critical";
  notes?: string;
  createdAt?: string;
  acceptedAt?: string;
  atPickupAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  // Verification & Handover
  pickupVerificationNotes?: string;
  pickupTempC?: number;
  pickupPhotoUrl?: string;
  deliveryVerificationNotes?: string;
  deliveryRecipientName?: string;
  deliveryPhotoUrl?: string;
  digitalSignature?: string;
}
