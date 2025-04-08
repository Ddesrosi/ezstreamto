import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    console.log("⏳ Requête reçue");
    const { prompt, ip } = await req.json();
    console.log("📥 Données reçues :", {
      prompt,
      ip
    });
    if (!prompt || !ip) {
      console.log("⚠️ Prompt ou IP manquant");
      return new Response(JSON.stringify({
        error: "Missing prompt or IP"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    console.log("🔍 Vérification des crédits Supabase...");
    const creditRes = await fetch(`${supabaseUrl}/functions/v1/search-limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        prompt,
        ip
      })
    });
    const creditData = await creditRes.json();
    console.log("🎫 Crédit reçu :", creditData);
    if (!creditRes.ok || !creditData.canSearch) {
      return new Response(JSON.stringify(creditData), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 403
      });
    }
    console.log("🎬 Envoi du prompt à Deepseek...");
    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    const deepseekText = await deepseekRes.text();
    if (!deepseekRes.ok) {
      return new Response(JSON.stringify({
        error: `Deepseek API error: ${deepseekText}`
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    let rawMovies;
    try {
      rawMovies = JSON.parse(deepseekText);
    } catch (e) {
      return new Response(JSON.stringify({
        error: `Invalid JSON from Deepseek: ${deepseekText}`
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    return new Response(JSON.stringify({
      rawMovies,
      remaining: creditData.remaining,
      isPremium: creditData.isPremium
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (e) {
    console.error("❌ Erreur serveur :", e);
    return new Response(JSON.stringify({
      error: e.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
