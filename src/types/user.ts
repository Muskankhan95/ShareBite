export type UserRole = "donor" | "ngo" | "volunteer" | "admin";

export type DonorCategory =
  | "Restaurant"
  | "Hotel"
  | "College Canteen"
  | "Hostel"
  | "Event Organizer"
  | "Individual";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  latitude?: number;
  longitude?: number;
  organizationName?: string;
  donorCategory?: DonorCategory;
  ngoRegistrationNumber?: string;
  ngoVerificationStatus?: "verified" | "pending" | "rejected";
  volunteerVehicleType?: "Bike" | "Car" | "Van" | "On Foot";
  createdAt: string;
}
