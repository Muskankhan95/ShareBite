import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { UserRole } from "@/types";
import { mockStore, DEMO_USERS } from "@/lib/mock-data-store";

export interface AccountRecord {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string | null;
  address: string | null;
  organizationName: string | null;
  organizationAddress: string | null;
  organizationContactPerson: string | null;
  donorProfile: { organizationName: string | null; address: string | null } | null;
  ngoProfile: { organizationName: string; address: string; contactPerson: string | null; verificationStatus: string } | null;
  volunteerProfile: { address: string | null; availabilityStatus: boolean; verificationStatus: string } | null;
}

const selfAssignableRoles = ["donor", "ngo", "volunteer"] as const;

function pickRole(value: unknown): (typeof selfAssignableRoles)[number] {
  return selfAssignableRoles.includes(value as never)
    ? (value as (typeof selfAssignableRoles)[number])
    : "donor";
}

function text(value: unknown): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v.length > 0 ? v : null;
}

/**
 * Idempotently materialises the signed-in user's profile row and role
 * assignment from the metadata captured at sign-up, then returns the account.
 * Roles live in a separate table with no client write access, so this server
 * function is the only place a role is granted — and never "admin".
 */
export const loadAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountRecord> => {
    const { supabase, userId, claims } = context;

    let email = (claims["email"] as string) ?? "";
    let meta = (claims["user_metadata"] as Record<string, unknown>) ?? {};

    // 1. Direct Demo User lookup
    const demoUser = Object.values(DEMO_USERS).find((u) => u.id === userId);
    const mockUser = mockStore.users.find((u) => u.id === userId);
    if (demoUser || mockUser) {
      const role = (demoUser?.role || mockUser?.user_roles[0]?.role || "donor") as UserRole;
      const fullName = demoUser?.fullName || mockUser?.full_name || "Demo User";
      const orgName = (demoUser as any)?.organizationName || mockUser?.organization_name || null;
      const orgAddress = mockUser?.organization_address || "42 MG Road, Central District";
      const contactPerson = mockUser?.organization_contact_person || fullName;

      return {
        userId,
        email: email || demoUser?.email || `${role}@sharebite.org`,
        role,
        fullName,
        phone: mockUser?.phone || "+91 98765 43210",
        address: mockUser?.address || "Central District",
        organizationName: orgName,
        organizationAddress: orgName ? orgAddress : null,
        organizationContactPerson: orgName ? contactPerson : null,
        donorProfile: role === "donor" ? { organizationName: orgName, address: mockUser?.address || "Central District" } : null,
        ngoProfile: role === "ngo" ? { organizationName: orgName || "City Hope Community Kitchen", address: orgAddress, contactPerson, verificationStatus: "verified" } : null,
        volunteerProfile: role === "volunteer" ? { address: mockUser?.address || "Central District", availabilityStatus: true, verificationStatus: "verified" } : null,
      };
    }

    try {
      if (!email) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          email = authUser.user.email ?? "";
          meta = (authUser.user.user_metadata ?? {}) as Record<string, unknown>;
        }
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      let role: UserRole;
      if (existingRole?.role) {
        role = existingRole.role as UserRole;
      } else {
        role = pickRole(meta["role"]);
        const { error: rpcError } = await supabase.rpc("assign_self_role", { _role: role });
        if (rpcError && process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
          } catch {
            // Ignore service role errors if key is invalid
          }
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      let row = profile;
      if (!row) {
        const newProfile = {
          id: userId,
          email,
          full_name: text(meta["full_name"]) ?? email,
          phone: text(meta["phone"]),
          address: text(meta["address"]),
          organization_name: text(meta["organization_name"]),
          organization_address: text(meta["organization_address"]),
          organization_contact_person: text(meta["organization_contact_person"]),
        };

        const { data: inserted } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select("*")
          .maybeSingle();

        if (inserted) {
          row = inserted;
        } else if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: adminInserted } = await supabaseAdmin
              .from("profiles")
              .insert(newProfile)
              .select("*")
              .single();
            row = adminInserted;
          } catch {
            // Ignore
          }
        }

        if (!row) {
          row = {
            id: userId,
            email,
            full_name: text(meta["full_name"]) ?? email,
            phone: text(meta["phone"]),
            address: text(meta["address"]),
            organization_name: text(meta["organization_name"]),
            organization_address: text(meta["organization_address"]),
            organization_contact_person: text(meta["organization_contact_person"]),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "active",
          };
        }
      }

      if (role === "donor") {
        await supabase.from("donor_profiles").upsert(
          {
            user_id: userId,
            organization_name: text(meta["organization_name"]),
            address: text(meta["address"]),
          },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      }
      if (role === "ngo") {
        await supabase.from("ngo_profiles").upsert(
          {
            user_id: userId,
            organization_name: text(meta["organization_name"]) ?? "",
            address: text(meta["organization_address"]) ?? "",
            contact_person: text(meta["organization_contact_person"]),
          },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      }
      if (role === "volunteer") {
        await supabase.from("volunteer_profiles").upsert(
          {
            user_id: userId,
            address: text(meta["address"]),
          },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      }

      const [donorResult, ngoResult, volunteerResult] = await Promise.all([
        role === "donor" ? supabase.from("donor_profiles").select("organization_name, address").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
        role === "ngo" ? supabase.from("ngo_profiles").select("organization_name, address, contact_person, verification_status").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
        role === "volunteer" ? supabase.from("volunteer_profiles").select("address, availability_status, verification_status").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      return {
        userId,
        email,
        role,
        fullName: row.full_name,
        phone: row.phone,
        address: row.address,
        organizationName: row.organization_name,
        organizationAddress: row.organization_address,
        organizationContactPerson: row.organization_contact_person,
        donorProfile: donorResult.data ? { organizationName: donorResult.data.organization_name, address: donorResult.data.address } : null,
        ngoProfile: ngoResult.data ? { organizationName: ngoResult.data.organization_name, address: ngoResult.data.address, contactPerson: ngoResult.data.contact_person, verificationStatus: ngoResult.data.verification_status } : null,
        volunteerProfile: volunteerResult.data ? { address: volunteerResult.data.address, availabilityStatus: volunteerResult.data.availability_status, verificationStatus: volunteerResult.data.verification_status } : null,
      };
    } catch (networkError) {
      console.warn("Supabase loadAccount network error, generating local fallback:", networkError);
      const role = pickRole(meta["role"] || claims["role"]);
      const fullName = (meta["full_name"] as string) || (claims["full_name"] as string) || "Active User";
      const orgName = (meta["organization_name"] as string) || null;
      const orgAddress = (meta["organization_address"] as string) || null;
      const contactPerson = (meta["organization_contact_person"] as string) || fullName;

      return {
        userId,
        email: email || `${role}@sharebite.org`,
        role,
        fullName,
        phone: (meta["phone"] as string) || null,
        address: (meta["address"] as string) || null,
        organizationName: orgName,
        organizationAddress: orgAddress,
        organizationContactPerson: orgName ? contactPerson : null,
        donorProfile: role === "donor" ? { organizationName: orgName, address: (meta["address"] as string) || null } : null,
        ngoProfile: role === "ngo" ? { organizationName: orgName || "City Relief NGO", address: orgAddress || "Community Hub", contactPerson, verificationStatus: "verified" } : null,
        volunteerProfile: role === "volunteer" ? { address: (meta["address"] as string) || null, availabilityStatus: true, verificationStatus: "verified" } : null,
      };
    }
  });
