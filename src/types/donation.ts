export type FoodCategory =
  | "Cooked meals"
  | "Rice"
  | "Bread/roti"
  | "Fruits"
  | "Vegetables"
  | "Bakery"
  | "Packaged food"
  | "Other";

export type FoodType =
  | FoodCategory
  | "Cooked Meals"
  | "Raw Groceries"
  | "Bakery & Bread"
  | "Fresh Produce"
  | "Packaged Food"
  | "Dairy";

export type DonationStatus =
  | "draft"
  | "published"
  | "available"
  | "requested"
  | "matched"
  | "accepted"
  | "pickup_assigned"
  | "in_transit"
  | "picked_up"
  | "delivered"
  | "completed"
  | "cancelled"
  | "expired";

export type QuantityUnit = "servings" | "kg" | "boxes" | "packets" | "meals";

export interface DonationItem {
  id: string;
  donorId: string;
  donorName: string;
  donorCategory: string;
  donorPhone: string;
  title: string;
  description: string;
  foodType: FoodType;
  quantity: number;
  unit: QuantityUnit;
  servingsEstimate: number;
  perishableHours?: number;
  preparationTime?: string;
  preparedAt?: string;
  availableUntil?: string;
  expiresAt: string;
  storageMethod?: string;
  allergens?: string[];
  imageUrl?: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  locationName?: string;
  latitude?: number;
  longitude?: number;
  pickupTimeWindow?: {
    start: string;
    end: string;
  };
  specialInstructions?: string;
  dietaryInfo?: string[];
  safetyConfirmed?: boolean;
  status: DonationStatus;
  claimedByNgoId?: string;
  claimedByNgoName?: string;
  claimedNgoAddress?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedVolunteerPhone?: string;
  createdAt: string;
  completedAt?: string;
}
