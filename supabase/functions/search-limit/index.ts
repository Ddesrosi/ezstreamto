import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ✅ Log forcé dès que la function démarre (avant même le try)
  console.log("🟢 Edge Function `search-limit` déclenchée !");

  try {
    const body = await req.json();
    const ip = body.ip;
    const mode = body.mode === "check" ? "check" : "consume";

    console.log("📦 Mode reçu:", mode);
    console.log("🌐 IP reçue:", ip);

    if (!ip) {
      return new Response(JSON.stringify({ error: "IP address is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ✅ Premium users: unlimited
    const { data: supporter } = await supabase
      .from("supporters")
      .select("ip_address")
      .eq("ip_address", ip)
      .eq("verified", true)
      .maybeSingle();

    if (supporter) {
      return new Response(JSON.stringify({
        canSearch: true,
        remaining: Infinity,
        total: Infinity,
        isPremium: true,
        message: "Premium user"
      }), { headers: corsHeaders });
    }

    const maxSearches = 5;
    const { data: searchData, error } = await supabase
      .from("ip_searches")
      .select("*")
      .eq("ip_address", ip)
      .maybeSingle();

    if (error) throw error;

    const currentCount = searchData?.search_count || 0;

    if (mode === "check") {
      const remaining = Math.max(0, maxSearches - currentCount);
      return new Response(JSON.stringify({
        canSearch: remaining > 0,
        remaining,
        total: maxSearches,
        isPremium: false,
        message: remaining > 0 ? "Credits checked" : "Search limit reached"
      }), { headers: corsHeaders });
    }

    // CONSUME
    if (currentCount >= maxSearches) {
      return new Response(JSON.stringify({
        canSearch: false,
        remaining: 0,
        total: maxSearches,
        isPremium: false,
        message: "You have reached the limit of free searches."
      }), { headers: corsHeaders });
    }

    let updatedCount = currentCount + 1;

    if (searchData) {
      const { error: updateError } = await supabase
        .from("ip_searches")
        .update({ search_count: updatedCount })
        .eq("ip_address", ip);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("ip_searches")
        .insert({ ip_address: ip, search_count: 1 });

      if (insertError) throw insertError;
      updatedCount = 1;
    }

    return new Response(JSON.stringify({
      canSearch: true,
      remaining: Math.max(0, maxSearches - updatedCount),
      total: maxSearches,
      isPremium: false,
      message: "Search recorded"
    }), { headers: corsHeaders });

  } catch (err) {
    console.error("❌ Error in search-limit function:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
