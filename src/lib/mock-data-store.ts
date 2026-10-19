/**
 * ShareBite Local & Demo Data Store.
 * Provides instant, zero-setup resilience when remote Supabase instances are unreachable,
 * offline, or paused, while seamlessly yielding to real Supabase whenever available.
 */

export interface MockDonation {
  id: string;
  donor_id: string;
  food_name: string;
  description: string | null;
  category: "cooked" | "raw" | "packaged" | "bakery" | "dairy" | "produce" | "other";
  quantity: number;
  quantity_unit: string;
  servings: number;
  available_until: string;
  preparation_time: string | null;
  storage_method: "ambient" | "refrigerated" | "frozen" | "hot_hold";
  allergens: string | null;
  pickup_address: string;
  status: "available" | "requested" | "accepted" | "in_transit" | "delivered" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; organization_name: string | null };
}

export interface MockFoodRequest {
  id: string;
  donation_id: string;
  ngo_id: string;
  requested_quantity: number;
  note: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  created_at: string;
  updated_at: string;
  donation?: MockDonation | null;
  ngo?: {
    id: string;
    name: string;
    contactPerson?: string | null;
    phone?: string | null;
    address: string;
    capacity?: number | null;
    verificationStatus: string;
  };
}

export interface MockPickup {
  id: string;
  donation_id: string;
  ngo_id: string;
  volunteer_id: string | null;
  pickup_location: string;
  delivery_location: string;
  status: "open" | "assigned" | "picked_up" | "delivered" | "cancelled";
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  donation?: MockDonation | null;
  ngo?: any;
  volunteer?: any;
}

export interface MockUserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  organization_name: string | null;
  organization_address: string | null;
  organization_contact_person: string | null;
  created_at: string;
  status: "active" | "suspended";
  user_roles: { role: string }[];
}

export interface MockNgoProfile {
  id: string;
  user_id: string;
  organization_name: string;
  address: string;
  contact_person: string | null;
  capacity: number | null;
  verification_status: "pending" | "verified" | "rejected";
  description: string | null;
  created_at: string;
  profiles?: MockUserProfile;
}

const DEMO_DONOR_ID = "11111111-1111-4111-a111-111111111111";
const DEMO_NGO_ID = "22222222-2222-4222-a222-222222222222";
const DEMO_VOLUNTEER_ID = "33333333-3333-4333-a333-333333333333";
const DEMO_ADMIN_ID = "44444444-4444-4444-a444-444444444444";

const now = new Date();
const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
const in10Hours = new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString();
const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

// In-Memory store (persisted in global scope)
class MemoryDataStore {
  donations: MockDonation[] = [
    {
      id: "d1111111-0000-0000-0000-000000000001",
      donor_id: DEMO_DONOR_ID,
      food_name: "Hot Vegetable Biryani & Dal Makhani",
      description: "Freshly prepared for evening conference. Packaged in insulated hot-containers.",
      category: "cooked",
      quantity: 25,
      quantity_unit: "kg",
      servings: 50,
      available_until: in4Hours,
      preparation_time: now.toISOString(),
      storage_method: "hot_hold",
      allergens: "Contains butter/dairy. Nut-free.",
      pickup_address: "Grand Orchid Hotel, 42 MG Road, Central District",
      status: "available",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      profiles: { full_name: "Rajesh Sharma", organization_name: "Grand Orchid Hotel" },
    },
    {
      id: "d2222222-0000-0000-0000-000000000002",
      donor_id: DEMO_DONOR_ID,
      food_name: "Artisan Multigrain Bread & Baguettes",
      description: "Baked this morning, unsold from daily retail batch. Pristine quality.",
      category: "bakery",
      quantity: 30,
      quantity_unit: "portions",
      servings: 30,
      available_until: in10Hours,
      preparation_time: now.toISOString(),
      storage_method: "ambient",
      allergens: "Contains gluten / wheat.",
      pickup_address: "Bakers Table Cafe, 15 Park Street",
      status: "available",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      profiles: { full_name: "Anita Desai", organization_name: "Bakers Table Cafe" },
    },
    {
      id: "d3333333-0000-0000-0000-000000000003",
      donor_id: DEMO_DONOR_ID,
      food_name: "Crate of Ripe Organic Tomatoes & Bell Peppers",
      description: "Fresh farm produce from morning delivery, surplus inventory.",
      category: "produce",
      quantity: 40,
      quantity_unit: "kg",
      servings: 80,
      available_until: in24Hours,
      preparation_time: now.toISOString(),
      storage_method: "ambient",
      allergens: null,
      pickup_address: "Greenfield Mart, Shop 8, Plaza Complex",
      status: "available",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      profiles: { full_name: "Greenfield Fresh Mart", organization_name: "Greenfield Fresh Mart" },
    },
    {
      id: "d4444444-0000-0000-0000-000000000004",
      donor_id: DEMO_DONOR_ID,
      food_name: "Steamed Rice & Lentil Curry",
      description: "Lunch surplus from university dining hall.",
      category: "cooked",
      quantity: 20,
      quantity_unit: "kg",
      servings: 45,
      available_until: yesterday,
      preparation_time: yesterday,
      storage_method: "ambient",
      allergens: null,
      pickup_address: "Campus Dining Hall, North Campus",
      status: "delivered",
      created_at: yesterday,
      updated_at: yesterday,
      profiles: { full_name: "Campus Dining", organization_name: "North Campus Canteen" },
    },
  ];

  requests: MockFoodRequest[] = [
    {
      id: "r1111111-0000-0000-0000-000000000001",
      donation_id: "d1111111-0000-0000-0000-000000000001",
      ngo_id: DEMO_NGO_ID,
      requested_quantity: 25,
      note: "We have volunteer transport ready to distribute to 50 shelter residents tonight.",
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      ngo: {
        id: DEMO_NGO_ID,
        name: "City Hope Community Kitchen",
        contactPerson: "Pooja Verma",
        phone: "+91 98765 43210",
        address: "88 Civil Lines, North Hub",
        capacity: 100,
        verificationStatus: "verified",
      },
    },
  ];

  pickups: MockPickup[] = [
    {
      id: "p4444444-0000-0000-0000-000000000004",
      donation_id: "d4444444-0000-0000-0000-000000000004",
      ngo_id: DEMO_NGO_ID,
      volunteer_id: DEMO_VOLUNTEER_ID,
      pickup_location: "Campus Dining Hall, North Campus",
      delivery_location: "City Hope Community Kitchen, 88 Civil Lines",
      status: "delivered",
      accepted_at: yesterday,
      picked_up_at: yesterday,
      delivered_at: yesterday,
      created_at: yesterday,
      updated_at: yesterday,
    },
  ];

  users: MockUserProfile[] = [
    {
      id: DEMO_DONOR_ID,
      full_name: "Rajesh Sharma",
      phone: "+91 98111 22334",
      address: "42 MG Road, Central District",
      organization_name: "Grand Orchid Hotel & Banquets",
      organization_address: "42 MG Road, Central District",
      organization_contact_person: "Rajesh Sharma",
      created_at: yesterday,
      status: "active",
      user_roles: [{ role: "donor" }],
    },
    {
      id: DEMO_NGO_ID,
      full_name: "Pooja Verma",
      phone: "+91 98765 43210",
      address: "88 Civil Lines, North Hub",
      organization_name: "City Hope Community Kitchen",
      organization_address: "88 Civil Lines, North Hub",
      organization_contact_person: "Pooja Verma",
      created_at: yesterday,
      status: "active",
      user_roles: [{ role: "ngo" }],
    },
    {
      id: DEMO_VOLUNTEER_ID,
      full_name: "Vikram Singh",
      phone: "+91 99887 76655",
      address: "Sector 14, Metro Corridor",
      organization_name: null,
      organization_address: null,
      organization_contact_person: null,
      created_at: yesterday,
      status: "active",
      user_roles: [{ role: "volunteer" }],
    },
    {
      id: DEMO_ADMIN_ID,
      full_name: "Platform Administrator",
      phone: "+91 91234 56789",
      address: "ShareBite HQ, Tech Park",
      organization_name: "ShareBite Foundation",
      organization_address: "Tech Park, Cyber City",
      organization_contact_person: "Admin Lead",
      created_at: yesterday,
      status: "active",
      user_roles: [{ role: "admin" }],
    },
  ];

  ngoProfiles: MockNgoProfile[] = [
    {
      id: "ngo-profile-1",
      user_id: DEMO_NGO_ID,
      organization_name: "City Hope Community Kitchen",
      address: "88 Civil Lines, North Hub",
      contact_person: "Pooja Verma",
      capacity: 150,
      verification_status: "verified",
      description: "Serving over 150 nutritious meals daily to urban homeless shelters.",
      created_at: yesterday,
    },
    {
      id: "ngo-profile-2",
      user_id: "55555555-5555-5555-5555-555555555555",
      organization_name: "Feeding Hands Relief Trust",
      address: "24 Station Road, West Sector",
      contact_person: "Dr. Sunita Rao",
      capacity: 80,
      verification_status: "pending",
      description: "Distributes food packages to evening night shelters and elder care centers.",
      created_at: now.toISOString(),
    },
  ];
}

// Global singleton
const globalForStore = globalThis as unknown as { __sharebite_store?: MemoryDataStore };
export const mockStore = globalForStore.__sharebite_store || new MemoryDataStore();
if (process.env.NODE_ENV !== "production") globalForStore.__sharebite_store = mockStore;

export const DEMO_USERS = {
  donor: {
    id: DEMO_DONOR_ID,
    email: "donor@sharebite.org",
    role: "donor" as const,
    fullName: "Rajesh Sharma",
    organizationName: "Grand Orchid Hotel & Banquets",
  },
  ngo: {
    id: DEMO_NGO_ID,
    email: "ngo@sharebite.org",
    role: "ngo" as const,
    fullName: "Pooja Verma",
    organizationName: "City Hope Community Kitchen",
  },
  volunteer: {
    id: DEMO_VOLUNTEER_ID,
    email: "volunteer@sharebite.org",
    role: "volunteer" as const,
    fullName: "Vikram Singh",
  },
  admin: {
    id: DEMO_ADMIN_ID,
    email: "admin@sharebite.org",
    role: "admin" as const,
    fullName: "Platform Administrator",
  },
};
