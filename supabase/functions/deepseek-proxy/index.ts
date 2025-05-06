console.log("✅ DEEPSEEK-PROXY - fichier réellement déployé");

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("✅ DEEPSEEK-PROXY - fichier réellement déployé");

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log("🚀 Supabase Edge Function ready");

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const normalizedOrigin = origin.replace(/:\d+$/, ""); // enlève le port à la fin

  const isAllowed =
    normalizedOrigin === "https://ezstreamto.com" ||
    normalizedOrigin === "http://localhost" ||
    normalizedOrigin === "https://localhost" ||
    normalizedOrigin.endsWith(".local-credentialless.webcontainer-api.io");

  const cors = {
    "Access-Control-Allow-Origin": isAllowed ? normalizedOrigin : "https://ezstreamto.com",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };

  console.log("🌐 Origin received:", origin);
  console.log("🌐 Normalized Origin:", normalizedOrigin);
  console.log("✅ CORS allowed:", isAllowed);
  console.log("🧪 getCorsHeaders() resolved to:", JSON.stringify(cors));

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        "Content-Length": "0"
      }
    });
  }

  try {
    console.log("⏳ Requête reçue");
    const { prompt, ip } = await req.json();
    console.log("📥 Données reçues :", { prompt, ip });

    if (!prompt || !ip) {
      console.log("⚠️ Prompt ou IP manquant");
      console.log("🧪 CORS headers before return:", cors);

      return new Response(JSON.stringify({
        error: "Missing prompt or IP"
      }), {
        headers: {
          ...cors,
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
      body: JSON.stringify({ prompt, ip })
    });

    const creditData = await creditRes.json();
    console.log("🎫 Crédit reçu :", creditData);

    if (!creditRes.ok || !creditData.canSearch) {
      console.log("🧪 CORS headers before return:", cors);
      return new Response(JSON.stringify(creditData), {
        headers: {
          ...cors,
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
        messages: [{ role: "user", content: prompt }]
      })
    });

    const deepseekText = await deepseekRes.text();

    if (!deepseekRes.ok) {
      console.log("🧪 CORS headers before return:", cors);
      return new Response(JSON.stringify({
        error: `Deepseek API error: ${deepseekText}`
      }), {
        headers: {
          ...cors,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }

    let rawMovies;
    try {
      rawMovies = JSON.parse(deepseekText);
    } catch (e) {
      console.log("🧪 CORS headers before return:", cors);
      return new Response(JSON.stringify({
        error: `Invalid JSON from Deepseek: ${deepseekText}`
      }), {
        headers: {
          ...cors,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
console.log("🧪 CORS headers before return:", cors);
    return new Response(JSON.stringify({
      rawMovies,
      remaining: creditData.remaining,
      isPremium: creditData.isPremium
    }), {
      headers: {
        ...cors,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (e) {
    console.error("❌ Erreur serveur :", e);
    console.log("🧪 CORS headers before return:", cors);
    return new Response(JSON.stringify({
      error: e.message
    }), {
      headers: {
        ...cors,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
