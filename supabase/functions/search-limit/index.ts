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
    const mode = body.mode || "check"; // Default to "check" mode

    console.log("📦 Mode:", mode);
    console.log("🌐 IP:", ip);

    if (!ip) {
      return new Response(JSON.stringify({ error: "IP address is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check for premium status first
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
    const isNewDay = searchData?.last_search 
      ? new Date(searchData.last_search).getDate() !== new Date().getDate()
      : true;

    // If mode is "check", just return the current status
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

    // Handle consume mode
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

    // Reset count if it's a new day
    const newCount = isNewDay ? 1 : currentCount + 1;

    if (searchData) {
      const { error: updateError } = await supabase
        .from("ip_searches")
        .update({ 
          search_count: newCount,
          last_search: new Date().toISOString()
        })
        .eq("ip_address", ip);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("ip_searches")
        .insert({ 
          ip_address: ip, 
          search_count: 1,
          last_search: new Date().toISOString()
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