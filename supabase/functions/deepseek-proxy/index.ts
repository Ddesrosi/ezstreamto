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
  const body = await req.json();
  console.log("🧪 JSON complet reçu dans deepseek-proxy:", body);

  const { prompt, explanationPrompt, ip, uuid, isPremium } = body;
  const finalPrompt = explanationPrompt || prompt;
  console.log("📥 Reçu dans proxy:", { prompt, explanationPrompt, finalPrompt, ip, uuid, isPremium });

  if (!finalPrompt) {
    console.log("⚠️ Aucun prompt valide transmis");
    return new Response(JSON.stringify({
      error: "Missing final prompt"
    }), {
      headers: {
        ...cors,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }

  if (!ip && !isPremium) {
    console.warn("⚠️ IP manquante pour utilisateur non-premium");
    return new Response(JSON.stringify({
      error: "IP required for non-premium users"
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 400
    });
  }

  // 🔍 Vérification des crédits avec search-limit (sauf pour appels serveur Premium)
  let creditData = {
    canSearch: true,
    remaining: null,
    isPremium: isPremium
  };

  if (!isPremium && uuid !== "perfect-match-server") {
  const creditRes = await fetch(`${supabaseUrl}/functions/v1/search-limit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceRoleKey}`
    },
    body: JSON.stringify({ prompt, uuid })
  });

  creditData = await creditRes.json();
  console.log("🎫 Crédit reçu :", creditData);

  if (!creditRes.ok || !creditData.canSearch) {
    return new Response(JSON.stringify(creditData), {
      headers: {
        ...cors,
        "Content-Type": "application/json"
      },
      status: 403
    });
  }
}

  // 🎬 Appel à Deepseek
  console.log("🎬 Envoi du prompt à Deepseek...");

let rawMovies = null;
let rawText = null;       // ✅ pour éviter ReferenceError
let deepseekRes;

try {
  deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
      content: finalPrompt
    }
  ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" }
  })
});

  if (!deepseekRes.ok) {
  const errorText = await deepseekRes.text();
  throw new Error(`Deepseek API error: ${errorText}`);
}

const data = await deepseekRes.json();
console.log("📦 Deepseek JSON reçu:", data);

rawText = JSON.stringify(data);

} catch (error) {
  console.error("❌ Erreur Deepseek:", error);
  console.warn("⚠️ Réponse brute non affichée : body déjà consommé.");

  return new Response(JSON.stringify({
    error: "Failed to fetch or parse Deepseek response"
  }), {
    headers: {
      ...cors,
      "Content-Type": "application/json"
    },
    status: 500
  });
}

return new Response(JSON.stringify({
  rawText,
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