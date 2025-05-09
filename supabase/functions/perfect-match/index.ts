import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { generatePerfectMatchInsights } from "./insights.ts";
import type { SearchPreferences } from "../_shared/types.ts";

console.log("✅ Supabase Edge Function `perfect-match` ready");

serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const cors = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors
    });
  }

  try {
    const body = await req.json();
    const preferences: SearchPreferences = body.preferences;

    console.log("📥 Received preferences:", preferences);

    const result = await generatePerfectMatchInsights(preferences, req);

    console.log("✅ Result:", result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...cors,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("❌ Error in perfect-match handler:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
});
