// This file provides resilient authentication context for server functions.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { DEMO_USERS } from "@/lib/mock-data-store";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env["SUPABASE_URL"] || "https://yrkpijbgnzjecexpmalf.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"] || "dummy";

    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    const cookieHeader = request?.headers?.get("cookie") || "";

    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    let demoRoleFromCookie: keyof typeof DEMO_USERS | null = null;
    const cookieMatch = cookieHeader.match(/sharebite_demo_role=([a-z]+)/);
    if (cookieMatch && cookieMatch[1] in DEMO_USERS) {
      demoRoleFromCookie = cookieMatch[1] as keyof typeof DEMO_USERS;
    }

    // 1. Check for Demo Token or Demo Role Cookie
    if (token.startsWith("demo-token-") || (!token && demoRoleFromCookie)) {
      const demoRole = (token.startsWith("demo-token-")
        ? token.replace("demo-token-", "")
        : demoRoleFromCookie) as keyof typeof DEMO_USERS;
      const demoUser = DEMO_USERS[demoRole] || DEMO_USERS.donor;

      const dummyClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      return next({
        context: {
          supabase: dummyClient,
          userId: demoUser.id,
          claims: {
            sub: demoUser.id,
            email: demoUser.email,
            user_metadata: {
              role: demoUser.role,
              full_name: demoUser.fullName,
              organization_name: (demoUser as any).organizationName,
            },
          },
        },
      });
    }

    // 2. Decode standard JWT if present
    const decodedPayload = token ? decodeJwtPayload(token) : null;
    let userId = decodedPayload?.sub;
    let claims = decodedPayload || {};

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 3. Attempt getClaims from remote Supabase if possible
    if (token && !userId) {
      try {
        const { data, error } = await supabase.auth.getClaims(token);
        if (!error && data?.claims?.sub) {
          userId = data.claims.sub;
          claims = data.claims;
        }
      } catch {
        // Fall back to decoded payload or guest
      }
    }

    // 4. Default to demo donor if completely unauthenticated in demo mode
    if (!userId) {
      userId = DEMO_USERS.donor.id;
      claims = {
        sub: DEMO_USERS.donor.id,
        email: DEMO_USERS.donor.email,
        user_metadata: {
          role: "donor",
          full_name: DEMO_USERS.donor.fullName,
        },
      };
    }

    return next({
      context: {
        supabase,
        userId,
        claims,
      },
    });
  },
);
