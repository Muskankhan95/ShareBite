import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const listMyDonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("food_donations")
      .select("*")
      .eq("donor_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load your donations");
    return data;
  });

export const createDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => donationInput.parse(input))
  .handler(async ({ data, context }) => {
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
    if (error || !donation) throw new Error("Could not publish this donation");
    return donation;
  });

export const getDonation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: donation, error } = await context.supabase
      .from("food_donations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load this donation");
    return donation;
  });

export const listNearbyDonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("food_donations")
      .select("*")
      .eq("status", "available")
      .gt("available_until", new Date().toISOString())
      .order("available_until", { ascending: true });
    if (error) throw new Error("Could not load nearby food");
    return data;
  });

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: requests, error } = await context.supabase
      .from("food_requests")
      .select("*")
      .eq("ngo_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load your requests");
    if (requests.length === 0) return [];

    const donationIds = requests.map((request) => request.donation_id);
    const { data: donations, error: donationError } = await context.supabase
      .from("food_donations")
      .select("id, food_name, servings, pickup_address, available_until, status")
      .in("id", donationIds);
    if (donationError) throw new Error("Could not load requested donations");
    const byId = new Map((donations ?? []).map((donation) => [donation.id, donation]));
    return requests.map((request) => ({ ...request, donation: byId.get(request.donation_id) ?? null }));
  });

export const requestDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ donationId: z.string().uuid(), requestedQuantity: z.number().positive(), note: z.string().trim().max(1000).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
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
    if (error || !request) throw new Error(error?.code === "23505" ? "You already requested this donation" : "Could not send request");
    return request;
  });

export const listAvailablePickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pickups")
      .select("*")
      .eq("status", "open")
      .is("volunteer_id", null)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load available pickups");
    return data;
  });

export const listMyPickups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pickups")
      .select("*")
      .eq("volunteer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load your pickups");
    return data;
  });

export const getPickup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: pickup, error } = await context.supabase.from("pickups").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error("Could not load this pickup");
    return pickup;
  });

export const claimPickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: pickup, error } = await context.supabase
      .from("pickups")
      .update({ volunteer_id: context.userId, status: "assigned", accepted_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("status", "open")
      .is("volunteer_id", null)
      .select("*")
      .maybeSingle();
    if (error || !pickup) throw new Error("This pickup is no longer available");
    return pickup;
  });

export const updatePickupStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["picked_up", "delivered"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const patch = data.status === "picked_up"
      ? { status: data.status, picked_up_at: new Date().toISOString() }
      : { status: data.status, delivered_at: new Date().toISOString() };
    const { data: pickup, error } = await context.supabase
      .from("pickups")
      .update(patch)
      .eq("id", data.id)
      .eq("volunteer_id", context.userId)
      .select("*")
      .maybeSingle();
    if (error || !pickup) throw new Error("Could not update this pickup");
    return pickup;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(20).optional(),
    address: z.string().trim().max(300).optional(),
    organizationName: z.string().trim().max(150).optional(),
    organizationAddress: z.string().trim().max(300).optional(),
    organizationContactPerson: z.string().trim().max(100).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update({
      full_name: data.fullName,
      phone: data.phone || null,
      address: data.address || null,
      organization_name: data.organizationName || null,
      organization_address: data.organizationAddress || null,
      organization_contact_person: data.organizationContactPerson || null,
    }).eq("id", context.userId);
    if (error) throw new Error("Could not save your profile");
    return { ok: true };
  });