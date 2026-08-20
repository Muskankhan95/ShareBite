import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { UserRole } from "@/types";

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
    const { supabase, userId } = context;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser.user) throw new Error("Account not found");

    const meta = (authUser.user.user_metadata ?? {}) as Record<string, unknown>;
    const email = authUser.user.email ?? "";

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
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (roleError && roleError.code !== "23505") throw new Error("Could not assign your role");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    let row = profile;
    if (!row) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email,
          full_name: text(meta["full_name"]) ?? email,
          phone: text(meta["phone"]),
          address: text(meta["address"]),
          organization_name: text(meta["organization_name"]),
          organization_address: text(meta["organization_address"]),
          organization_contact_person: text(meta["organization_contact_person"]),
        })
        .select("*")
        .single();
      if (insertError) throw new Error("Could not create your profile");
      row = inserted;
    }

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
    };
  });
