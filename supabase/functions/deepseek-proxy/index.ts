import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey || !deepseekApiKey) {
  console.error("❌ Missing required environment variables");
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    });
  }

  try {
    console.log("⏳ Request received");
    
    const { prompt, ip } = await req.json();
    console.log("📥 Received data:", { prompt, ip });

    if (!prompt || !ip) {
      console.log("⚠️ Missing prompt or IP");
      return new Response(
        JSON.stringify({ error: "Missing prompt or IP" }),
        {
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          },
          status: 400
        }
      );
    }

    console.log("🔍 Verifying Supabase credits...");
    try {
      const creditRes = await fetch(`${supabaseUrl}/functions/v1/search-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ prompt, ip })
      });

      if (!creditRes.ok) {
        const errorText = await creditRes.text();
        console.error("❌ Credit verification failed:", errorText);
        return new Response(
          JSON.stringify({ error: `Failed to verify search credits: ${errorText}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: creditRes.status
          }
        );
      }

      const creditData = await creditRes.json();
      console.log("🎫 Credits verified:", creditData);

      if (!creditData.canSearch) {
        return new Response(
          JSON.stringify(creditData),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403
          }
        );
      }
    } catch (error) {
      console.error("❌ Error verifying credits:", error);
      return new Response(
        JSON.stringify({ error: "Failed to verify search credits: Network error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    console.log("🎬 Sending prompt to Deepseek...");
    try {
      const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekApiKey}`,
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!deepseekRes.ok) {
        const errorText = await deepseekRes.text();
        console.error("❌ Deepseek API error:", {
          status: deepseekRes.status,
          statusText: deepseekRes.statusText,
          error: errorText
        });
        return new Response(
          JSON.stringify({ 
            error: `Deepseek API error (${deepseekRes.status}): ${errorText}`,
            details: {
              status: deepseekRes.status,
              statusText: deepseekRes.statusText
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: deepseekRes.status
          }
        );
      }

      const deepseekText = await deepseekRes.text();
      let rawMovies;

      try {
        rawMovies = JSON.parse(deepseekText);
      } catch (e) {
        console.error("❌ Failed to parse Deepseek response:", e);
        return new Response(
          JSON.stringify({ 
            error: `Invalid JSON from Deepseek: ${e.message}`,
            rawResponse: deepseekText
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
          }
        );
      }

      return new Response(
        JSON.stringify({
          rawMovies,
          remaining: creditData.remaining,
          isPremium: creditData.isPremium
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );

    } catch (error) {
      console.error("❌ Network error calling Deepseek API:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to connect to Deepseek API",
          details: error.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503
        }
      );
    }

  } catch (e) {
    console.error("❌ Server error:", e);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: e.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});