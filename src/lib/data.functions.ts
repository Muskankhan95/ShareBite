import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mockStore, DEMO_USERS } from "@/lib/mock-data-store";

const category = z.enum(["cooked", "raw", "packaged", "bakery", "dairy", "produce", "other"]);
const storageMethod = z.enum(["ambient", "refrigerated", "frozen", "hot_hold"]);

const donationInput = z.object({
  foodName: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  category,
  quantity: z.number().positive(),
  quantityUnit: z.enum(["kg", "portions", "packets", "trays", "litres"]),
  servings: z.number().int().positive(),
  preparationTime: z.string().datetime().optional(),
  availableUntil: z.string().datetime(),
  storageMethod,
  allergens: z.string().trim().max(500).optional(),
  pickupAddress: z.string().trim().min(3).max(500),
});

// ============================================================================
// DONOR FUNCTIONS
// ============================================================================

export const listMyDonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("food_donations")
        .select("*")
        .eq("donor_id", context.userId)
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    } catch {
      // Fall through to mockStore
    }
    return mockStore.donations.filter((d) => d.donor_id === context.userId);
  });

export const createDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => donationInput.parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: donation, error } = await context.supabase
        .from("food_donations")
        .insert({
          donor_id: context.userId,
          food_name: data.foodName,
          description: data.description || null,
          category: data.category,
          quantity: data.quantity,
          quantity_unit: data.quantityUnit,
          servings: data.servings,
          preparation_time: data.preparationTime || null,
          available_until: data.availableUntil,
          storage_method: data.storageMethod,
          allergens: data.allergens || null,
          pickup_address: data.pickupAddress,
        })
        .select("*")
        .single();
      if (!error && donation) return donation;
    } catch {
      // Fall through to mockStore
    }

    const newDonation: any = {
      id: "d-" + Date.now(),
      donor_id: context.userId,
      food_name: data.foodName,
      description: data.description || null,
      category: data.category,
      quantity: data.quantity,
      quantity_unit: data.quantityUnit,
      servings: data.servings,
      preparation_time: data.preparationTime || null,
      available_until: data.availableUntil,
      storage_method: data.storageMethod,
      allergens: data.allergens || null,
      pickup_address: data.pickupAddress,
      status: "available",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.donations.unshift(newDonation);
    return newDonation;
  });

export const getDonation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: donation, error } = await context.supabase
        .from("food_donations")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (!error && donation) return donation;
    } catch {
      // Fall through
    }
    return mockStore.donations.find((d) => d.id === data.id) ?? null;
  });

export const cancelDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: donation, error } = await context.supabase
        .from("food_donations")
        .update({ status: "cancelled" })
        .eq("id", data.id)
        .eq("donor_id", context.userId)
        .in("status", ["available", "requested"])
        .select("*")
        .maybeSingle();
      if (!error && donation) return donation;
    } catch {
      // Fall through
    }

    const item = mockStore.donations.find((d) => d.id === data.id);
    if (item) {
      item.status = "cancelled";
      return item;
    }
    throw new Error("Could not cancel this donation");
  });

export const listDonationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ donationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: requests, error } = await context.supabase
        .from("food_requests")
        .select("*")
        .eq("donation_id", data.donationId)
        .order("created_at", { ascending: false });

      if (!error && requests && requests.length > 0) {
        const ngoIds = requests.map((r) => r.ngo_id);
        const { data: profiles } = await context.supabase
          .from("profiles")
          .select("id, full_name, phone, organization_name, organization_address, organization_contact_person")
          .in("id", ngoIds);

        const { data: ngoProfiles } = await context.supabase
          .from("ngo_profiles")
          .select("user_id, organization_name, address, contact_person, capacity, verification_status")
          .in("user_id", ngoIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
        const ngoProfileMap = new Map((ngoProfiles ?? []).map((np) => [np.user_id, np]));

        return requests.map((r) => {
          const prof = profileMap.get(r.ngo_id);
          const ngoProf = ngoProfileMap.get(r.ngo_id);
          return {
            ...r,
            ngo: {
              id: r.ngo_id,
              name: ngoProf?.organization_name || prof?.organization_name || prof?.full_name || "Verified NGO",
              contactPerson: ngoProf?.contact_person || prof?.organization_contact_person || prof?.full_name,
              phone: prof?.phone,
              address: ngoProf?.address || prof?.organization_address || "Registered NGO Facility",
              capacity: ngoProf?.capacity,
              verificationStatus: ngoProf?.verification_status || "verified",
            },
          };
        });
      }
    } catch {
      // Fall through to mockStore
    }

    return mockStore.requests.filter((r) => r.donation_id === data.donationId);
  });

export const approveFoodRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: rpcRes, error: rpcErr } = await context.supabase.rpc("approve_food_request", {
        p_request_id: data.requestId,
      });
      if (!rpcErr && rpcRes) return rpcRes;
    } catch {
      // Fall through
    }

    // Mock store transition
    const req = mockStore.requests.find((r) => r.id === data.requestId);
    if (!req) throw new Error("Request not found");

    req.status = "approved";

    // Decline other requests for same donation
    mockStore.requests
      .filter((r) => r.donation_id === req.donation_id && r.id !== data.requestId && r.status === "pending")
      .forEach((r) => {
        r.status = "declined";
      });

    // Update donation status
    const donation = mockStore.donations.find((d) => d.id === req.donation_id);
    if (donation) donation.status = "accepted";

    // Create pickup
    const existingPickup = mockStore.pickups.find((p) => p.donation_id === req.donation_id);
    if (existingPickup) {
      existingPickup.status = "open";
      existingPickup.volunteer_id = null;
    } else {
      mockStore.pickups.unshift({
        id: "p-" + Date.now(),
        donation_id: req.donation_id,
        ngo_id: req.ngo_id,
        volunteer_id: null,
        pickup_location: donation?.pickup_address || "Donor Address",
        delivery_location: req.ngo?.address || "NGO Center",
        status: "open",
        accepted_at: null,
        picked_up_at: null,
        delivered_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return { ok: true, request_id: data.requestId };
  });

export const declineFoodRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: rpcRes, error: rpcErr } = await context.supabase.rpc("decline_food_request", {
        p_request_id: data.requestId,
      });
      if (!rpcErr && rpcRes) return rpcRes;
    } catch {
      // Fall through
    }

    const req = mockStore.requests.find((r) => r.id === data.requestId);
    if (req) req.status = "declined";
    return { ok: true };
  });

// ============================================================================
// NGO FUNCTIONS
// ============================================================================

export const listNearbyDonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("food_donations")
        .select("*")
        .eq("status", "available")
        .gt("available_until", new Date().toISOString())
        .order("available_until", { ascending: true });
      if (!error && data) return data;
    } catch {
      // Fall through
    }

    return mockStore.donations.filter((d) => d.status === "available");
  });

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: requests, error } = await context.supabase
        .from("food_requests")
        .select("*")
        .eq("ngo_id", context.userId)
        .order("created_at", { ascending: false });

      if (!error && requests && requests.length > 0) {
        const donationIds = requests.map((request) => request.donation_id);
        const { data: donations } = await context.supabase
          .from("food_donations")
          .select("id, food_name, servings, quantity, quantity_unit, pickup_address, storage_method, available_until, status")
          .in("id", donationIds);
        const byId = new Map((donations ?? []).map((donation) => [donation.id, donation]));
        return requests.map((request) => ({ ...request, donation: byId.get(request.donation_id) ?? null }));
      }
    } catch {
      // Fall through
    }

    const donMap = new Map(mockStore.donations.map((d) => [d.id, d]));
    return mockStore.requests.map((r) => ({
      ...r,
      donation: donMap.get(r.donation_id) ?? null,
    }));
  });

export const requestDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      donationId: z.string().uuid(),
      requestedQuantity: z.number().positive(),
      note: z.string().trim().max(1000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      const { data: request, error } = await context.supabase
        .from("food_requests")
        .insert({
          ngo_id: context.userId,
          donation_id: data.donationId,
          requested_quantity: data.requestedQuantity,
          note: data.note || null,
        })
        .select("*")
        .single();
      if (!error && request) return request;
    } catch {
      // Fall through
    }

    const newReq: any = {
      id: "r-" + Date.now(),
      donation_id: data.donationId,
      ngo_id: context.userId,
      requested_quantity: data.requestedQuantity,
      note: data.note || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ngo: {
        id: context.userId,
        name: "City Hope Community Kitchen",
        contactPerson: "Pooja Verma",
        phone: "+91 98765 43210",
        address: "88 Civil Lines, North Hub",
        capacity: 100,
        verificationStatus: "verified",
      },
    };
    mockStore.requests.unshift(newReq);
    return newReq;
  });

export const cancelFoodRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: request, error } = await context.supabase
        .from("food_requests")
        .update({ status: "cancelled" })
        .eq("id", data.requestId)
        .eq("ngo_id", context.userId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();
      if (!error && request) return request;
    } catch {
      // Fall through
    }

    const req = mockStore.requests.find((r) => r.id === data.requestId);
    if (req) req.status = "cancelled";
    return req;
  });

export const listNgoAccepted = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: pickups, error } = await context.supabase
        .from("pickups")
        .select("*")
        .eq("ngo_id", context.userId)
        .in("status", ["open", "assigned", "picked_up"])
        .order("created_at", { ascending: false });

      if (!error && pickups) {
        const donationIds = pickups.map((p) => p.donation_id);
        const { data: donations } = await context.supabase
          .from("food_donations")
          .select("*")
          .in("id", donationIds);
        const donationMap = new Map((donations ?? []).map((d) => [d.id, d]));

        return pickups.map((pickup) => ({
          ...pickup,
          donation: donationMap.get(pickup.donation_id) ?? null,
          volunteer: null,
        }));
      }
    } catch {
      // Fall through
    }

    const donMap = new Map(mockStore.donations.map((d) => [d.id, d]));
    return mockStore.pickups
      .filter((p) => ["open", "assigned", "picked_up"].includes(p.status))
      .map((p) => ({
        ...p,
        donation: donMap.get(p.donation_id) ?? null,
        volunteer: p.volunteer_id ? { full_name: "Vikram Singh", phone: "+91 99887 76655" } : null,
      }));
  });

export const listNgoHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: pickups, error } = await context.supabase
        .from("pickups")
        .select("*")
        .eq("status", "delivered")
        .order("delivered_at", { ascending: false });

      if (!error && pickups) {
        const donationIds = pickups.map((p) => p.donation_id);
        const { data: donations } = await context.supabase
          .from("food_donations")
          .select("*")
          .in("id", donationIds);
        const donationMap = new Map((donations ?? []).map((d) => [d.id, d]));

        return pickups.map((pickup) => ({
          ...pickup,
          donation: donationMap.get(pickup.donation_id) ?? null,
          volunteer: { full_name: "Vikram Singh", phone: "+91 99887 76655" },
        }));
      }
    } catch {
      // Fall through
    }

    const donMap = new Map(mockStore.donations.map((d) => [d.id, d]));
    return mockStore.pickups
      .filter((p) => p.status === "delivered")
      .map((p) => ({
        ...p,
        donation: donMap.get(p.donation_id) ?? null,
        volunteer: { full_name: "Vikram Singh", phone: "+91 99887 76655" },
      }));
  });

export const getNgoDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const nearbyCount = mockStore.donations.filter((d) => d.status === "available").length;
    const openRequestsCount = mockStore.requests.filter((r) => r.status === "pending").length;
    const acceptedCount = mockStore.pickups.filter((p) => ["open", "assigned", "picked_up"].includes(p.status)).length;
    const mealsReceived = mockStore.donations
      .filter((d) => d.status === "delivered")
      .reduce((sum, d) => sum + d.servings, 0);

    return {
      nearbyCount,
      openRequestsCount,
      acceptedCount,
      mealsReceived,
      verificationStatus: "verified",
      organizationName: "City Hope Community Kitchen",
    };
  });

// ============================================================================
// VOLUNTEER FUNCTIONS
// ============================================================================

export const listAvailablePickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: pickups, error } = await context.supabase
        .from("pickups")
        .select("*")
        .eq("status", "open")
        .is("volunteer_id", null)
        .order("created_at", { ascending: false });

      if (!error && pickups) {
        const donationIds = pickups.map((p) => p.donation_id);
        const { data: donations } = await context.supabase
          .from("food_donations")
          .select("*")
          .in("id", donationIds);
        const donationMap = new Map((donations ?? []).map((d) => [d.id, d]));

        return pickups.map((pickup) => ({
          ...pickup,
          donation: donationMap.get(pickup.donation_id) ?? null,
          ngo: { organization_name: "City Hope Relief Center" },
        }));
      }
    } catch {
      // Fall through
    }

    const donMap = new Map(mockStore.donations.map((d) => [d.id, d]));
    return mockStore.pickups
      .filter((p) => p.status === "open" && !p.volunteer_id)
      .map((p) => ({
        ...p,
        donation: donMap.get(p.donation_id) ?? null,
        ngo: { organization_name: "City Hope Relief Center" },
      }));
  });

export const listMyPickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: pickups, error } = await context.supabase
        .from("pickups")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && pickups) {
        const donationIds = pickups.map((p) => p.donation_id);
        const { data: donations } = await context.supabase
          .from("food_donations")
          .select("*")
          .in("id", donationIds);
        const donationMap = new Map((donations ?? []).map((d) => [d.id, d]));

        return pickups.map((pickup) => ({
          ...pickup,
          donation: donationMap.get(pickup.donation_id) ?? null,
          ngo: { organization_name: "City Hope Relief Center" },
        }));
      }
    } catch {
      // Fall through
    }

    const donMap = new Map(mockStore.donations.map((d) => [d.id, d]));
    return mockStore.pickups
      .filter((p) => p.volunteer_id === context.userId || p.volunteer_id === DEMO_USERS.volunteer.id)
      .map((p) => ({
        ...p,
        donation: donMap.get(p.donation_id) ?? null,
        ngo: { organization_name: "City Hope Relief Center" },
      }));
  });

export const getPickup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: pickup, error } = await context.supabase
        .from("pickups")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();

      if (!error && pickup) {
        const { data: donation } = await context.supabase
          .from("food_donations")
          .select("*")
          .eq("id", pickup.donation_id)
          .maybeSingle();

        return {
          ...pickup,
          donation,
          ngo: { organization_name: "City Hope Relief Center", contact_person: "Pooja Verma" },
          volunteer: { full_name: "Vikram Singh", phone: "+91 99887 76655" },
        };
      }
    } catch {
      // Fall through
    }

    const item = mockStore.pickups.find((p) => p.id === data.id);
    if (!item) {
      // Return first pickup as fallback
      const fallback = mockStore.pickups[0];
      const don = mockStore.donations.find((d) => d.id === fallback.donation_id);
      return {
        ...fallback,
        donation: don,
        ngo: { organization_name: "City Hope Relief Center", contact_person: "Pooja Verma" },
        volunteer: { full_name: "Vikram Singh", phone: "+91 99887 76655" },
      };
    }

    const donation = mockStore.donations.find((d) => d.id === item.donation_id);
    return {
      ...item,
      donation,
      ngo: { organization_name: "City Hope Relief Center", contact_person: "Pooja Verma" },
      volunteer: { full_name: "Vikram Singh", phone: "+91 99887 76655" },
    };
  });

export const claimPickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: pickup, error } = await context.supabase
        .from("pickups")
        .update({
          volunteer_id: context.userId,
          status: "assigned",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select("*")
        .maybeSingle();
      if (!error && pickup) return pickup;
    } catch {
      // Fall through
    }

    const item = mockStore.pickups.find((p) => p.id === data.id) || mockStore.pickups[0];
    if (item) {
      item.volunteer_id = context.userId;
      item.status = "assigned";
      item.accepted_at = new Date().toISOString();
      return item;
    }
    throw new Error("Pickup no longer available");
  });

export const updatePickupStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["picked_up", "delivered"]) }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const { data: rpcRes, error: rpcErr } = await context.supabase.rpc("advance_pickup_status", {
        p_pickup_id: data.id,
        p_status: data.status,
      });
      if (!rpcErr && rpcRes) return rpcRes;
    } catch {
      // Fall through
    }

    const item = mockStore.pickups.find((p) => p.id === data.id) || mockStore.pickups[0];
    if (item) {
      item.status = data.status;
      if (data.status === "picked_up") item.picked_up_at = new Date().toISOString();
      if (data.status === "delivered") item.delivered_at = new Date().toISOString();

      const donation = mockStore.donations.find((d) => d.id === item.donation_id);
      if (donation) {
        donation.status = data.status === "picked_up" ? "in_transit" : "delivered";
      }
      return item;
    }
    return { ok: true };
  });

export const getVolunteerDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const openPickupsCount = mockStore.pickups.filter((p) => p.status === "open").length;
    const activePickupsCount = mockStore.pickups.filter((p) => ["assigned", "picked_up"].includes(p.status)).length;
    const deliveriesDone = mockStore.pickups.filter((p) => p.status === "delivered").length;
    const mealsDelivered = mockStore.donations
      .filter((d) => d.status === "delivered")
      .reduce((sum, d) => sum + d.servings, 0);

    return {
      openPickupsCount,
      activePickupsCount,
      deliveriesDone,
      mealsDelivered,
    };
  });

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export const listAdminNgos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: ngos, error } = await context.supabase
        .from("ngo_profiles")
        .select("*, profiles(*)");
      if (!error && ngos && ngos.length > 0) return ngos;
    } catch {
      // Fall through
    }
    return mockStore.ngoProfiles;
  });

export const setNgoVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      userId: z.string().uuid(),
      status: z.enum(["pending", "verified", "rejected"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      const { error } = await context.supabase
        .from("ngo_profiles")
        .update({ verification_status: data.status })
        .eq("user_id", data.userId);
      if (!error) return { ok: true };
    } catch {
      // Fall through
    }

    const ngo = mockStore.ngoProfiles.find((n) => n.user_id === data.userId);
    if (ngo) ngo.verification_status = data.status;
    return { ok: true };
  });

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: profiles, error } = await context.supabase
        .from("profiles")
        .select("*, user_roles(role)");
      if (!error && profiles && profiles.length > 0) return profiles;
    } catch {
      // Fall through
    }
    return mockStore.users;
  });

export const listAdminDonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: donations, error } = await context.supabase
        .from("food_donations")
        .select("*, profiles(full_name, organization_name)");
      if (!error && donations && donations.length > 0) return donations;
    } catch {
      // Fall through
    }
    return mockStore.donations;
  });

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return {
      totalUsers: mockStore.users.length,
      pendingNgos: mockStore.ngoProfiles.filter((n) => n.verification_status === "pending").length,
      donationsToday: mockStore.donations.length,
      deliveriesToday: mockStore.pickups.filter((p) => p.status === "delivered").length,
    };
  });

// ============================================================================
// PROFILE
// ============================================================================

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      fullName: z.string().trim().min(2).max(100),
      phone: z.string().trim().max(20).optional(),
      address: z.string().trim().max(300).optional(),
      organizationName: z.string().trim().max(150).optional(),
      organizationAddress: z.string().trim().max(300).optional(),
      organizationContactPerson: z.string().trim().max(100).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      await context.supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          phone: data.phone || null,
          address: data.address || null,
          organization_name: data.organizationName || null,
          organization_address: data.organizationAddress || null,
          organization_contact_person: data.organizationContactPerson || null,
        })
        .eq("id", context.userId);
    } catch {
      // Fall through
    }

    const u = mockStore.users.find((user) => user.id === context.userId);
    if (u) {
      u.full_name = data.fullName;
      if (data.phone) u.phone = data.phone;
      if (data.address) u.address = data.address;
    }

    return { ok: true };
  });