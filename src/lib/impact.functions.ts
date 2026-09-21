import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface ImpactStatistics {
  mealsRescued: number;
  foodWeightRescued: number;
  donationsCompleted: number;
  volunteersInvolved: number;
  organizationsInvolved: number;
}

export const getImpactStatistics = createServerFn({ method: "GET" }).handler(async (): Promise<ImpactStatistics> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return { mealsRescued: 0, foodWeightRescued: 0, donationsCompleted: 0, volunteersInvolved: 0, organizationsInvolved: 0 };

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await client.rpc("get_impact_statistics");
  if (error || !data || typeof data !== "object") return { mealsRescued: 0, foodWeightRescued: 0, donationsCompleted: 0, volunteersInvolved: 0, organizationsInvolved: 0 };
  const value = data as Record<string, unknown>;
  return {
    mealsRescued: Number(value["meals_rescued"] ?? 0),
    foodWeightRescued: Number(value["food_weight_rescued"] ?? 0),
    donationsCompleted: Number(value["donations_completed"] ?? 0),
    volunteersInvolved: Number(value["volunteers_involved"] ?? 0),
    organizationsInvolved: Number(value["organizations_involved"] ?? 0),
  };
});