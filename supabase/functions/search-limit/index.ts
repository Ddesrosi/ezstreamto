import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const normalizedOrigin = origin.replace(/:\d+$/, "");

  const cors = {
    "Access-Control-Allow-Origin": normalizedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        "Content-Length": "0"
      }
    });
  }

  console.log("🟢 Edge Function `search-limit` triggered!");

  try {
    const body = await req.json();
    const ip = body.ip;
    let uuid = body.uuid || null;
    const mode = body.mode || "check";

    console.log("📦 Mode:", mode);
    console.log("🌐 IP:", ip);
    console.log("🆔 UUID (before validation):", uuid);

    if (!ip && !uuid) {
      return new Response(JSON.stringify({ error: "IP or UUID is required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (uuid && typeof uuid !== "string") {
      console.warn("❌ Invalid UUID format: UUID must be a string");
      uuid = null;
    }

    const { data: supporter } = await supabase
      .from("supporters")
      .select("unlimited_searches")
      .or(`ip_address.eq.${ip},visitor_uuid.eq.${uuid}`)
      .eq("verified", true)
      .maybeSingle();

    if (supporter) {
      return new Response(JSON.stringify({
        canSearch: true,
        remaining: Infinity,
        total: Infinity,
        isPremium: true,
        message: "Premium user"
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const maxSearches = 5;

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

    if (mode === "check") {
      console.log("✅ Check mode - not incrementing count");
      const remaining = Math.max(0, maxSearches - currentCount);
      return new Response(JSON.stringify({
        canSearch: remaining > 0,
        remaining,
        total: maxSearches,
        isPremium: false,
        message: remaining > 0 ? "Credits checked" : "Search limit reached"
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    console.log("🔄 Consume mode - validating search");

    if (currentCount >= maxSearches && !isNewDay) {
      return new Response(JSON.stringify({
        canSearch: false,
        remaining: 0,
        total: maxSearches,
        isPremium: false,
        message: "You have reached the limit of free searches."
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const newCount = isNewDay ? 1 : currentCount + 1;

    if (searchData) {
      const { error: updateError } = await supabase
        .from("ip_searches")
        .update({
          uuid: uuid ? uuid.toLowerCase() : null,
          search_count: newCount,
          last_search: new Date().toISOString()
        })
        .eq(uuid ? "uuid" : "ip_address", uuid || ip);

      if (updateError) throw updateError;
    } else {
      console.log("📨 Inserting row with values:", {
        ip_address: ip,
        uuid,
        search_count: 1,
        last_search: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      if (!ip) {
        console.error("❌ IP address is null, cannot insert new record");
        return new Response(JSON.stringify({ error: "IP address is required for new searches" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const { error: insertError } = await supabase
        .from("ip_searches")
        .insert({
          ip_address: ip,
          uuid: uuid ? uuid.toString() : null,
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
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("❌ Error in search-limit function:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
