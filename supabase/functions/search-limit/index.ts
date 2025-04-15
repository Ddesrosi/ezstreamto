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

  console.log("🟢 Edge Function `search-limit` triggered!");

  try {
    const body = await req.json();
    const ip = body.ip;
    const uuid = body.uuid || null;
    const mode = body.mode || "check"; // Default to "check" mode

    console.log("📦 Mode:", mode);
    console.log("🌐 IP:", ip);
    console.log("🆔 UUID:", uuid);

    if (!ip && !uuid) {
      return new Response(JSON.stringify({ error: "IP or UUID is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check for premium status by IP only
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

    // 🔍 Recherche par UUID en priorité, sinon par IP
    const { data: searchData, error } = await supabase
      .from("ip_searches")
      .select("*")
      .eq(uuid ? "uuid" : "ip_address", uuid || ip)
      .maybeSingle();

    if (error) throw error;

    const currentCount = searchData?.search_count || 0;
    const isNewDay = searchData?.last_search 
      ? new Date(searchData.last_search).getDate() !== new Date().getDate()
      : true;

    // 🟡 Mode "check" : on retourne juste l'état
    if (mode === "check") {
      console.log("✅ Check mode - not incrementing count");
      const remaining = Math.max(0, maxSearches - currentCount);
      return new Response(JSON.stringify({
        canSearch: remaining > 0,
        remaining,
        total: maxSearches,
        isPremium: false,
        message: remaining > 0 ? "Credits checked" : "Search limit reached"
      }), { headers: corsHeaders });
    }

    // 🔁 Mode "consume" : on incrémente
    console.log("🔄 Consume mode - validating search");

    if (currentCount >= maxSearches && !isNewDay) {
      return new Response(JSON.stringify({
        canSearch: false,
        remaining: 0,
        total: maxSearches,
        isPremium: false,
        message: "You have reached the limit of free searches."
      }), { headers: corsHeaders });
    }

    const newCount = isNewDay ? 1 : currentCount + 1;

    if (searchData) {
      const { error: updateError } = await supabase
        .from("ip_searches")
        .update({ 
          search_count: newCount,
          last_search: new Date().toISOString()
        })
        .eq(uuid ? "uuid" : "ip_address", uuid || ip);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("ip_searches")
        .insert({ 
          ip_address: ip || null,
          uuid: uuid || null,
          search_count: 1,
          last_search: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    }

    console.log("✅ Search count updated:", newCount);

    return new Response(JSON.stringify({
      canSearch: true,
      remaining: Math.max(0, maxSearches - newCount),
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
