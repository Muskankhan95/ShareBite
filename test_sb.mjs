import { createClient } from "@supabase/supabase-js";

const client = createClient("https://yrkpijbgnzjecexpmalf.supabase.co", "sb_publishable_oHSTiOIHSKfF3KwHljE32w_1-LowBf8");

async function run() {
  console.log("Checking public tables...");
  const { data: donations, error: donError } = await client.from("food_donations").select("*").limit(5);
  console.log("food_donations:", { data: donations?.length, error: donError?.message });

  const { data: profiles, error: profError } = await client.from("profiles").select("*").limit(5);
  console.log("profiles:", { data: profiles?.length, error: profError?.message });

  const { data: ngos, error: ngoError } = await client.from("ngo_profiles").select("*").limit(5);
  console.log("ngo_profiles:", { data: ngos?.length, error: ngoError?.message });

  const { data: impact, error: impError } = await client.rpc("get_impact_statistics");
  console.log("get_impact_statistics RPC:", { impact, error: impError?.message });
}

run();
