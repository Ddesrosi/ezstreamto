import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { findPerfectMatchMovie } from "./find-movie.ts"; // à créer à l'étape suivante
import { generatePerfectMatchInsights } from "./insights.ts"; // à créer à l'étape suivante

serve(async (req) => {
    // ✅ Gestion du pré-vol CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders });
  }

  const body = await req.json();

  try {
    console.log("🚀 Perfect Match Edge Function triggered");

    const preferences = body.preferences;

    const movie = await findPerfectMatchMovie(preferences);

    console.log("🧪 Movie before insights:", movie);

    const insights = await generatePerfectMatchInsights(movie, preferences);

    return new Response(
      JSON.stringify({ movie, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
 } catch (error) {
  console.error("❌ Perfect Match backend error:", error instanceof Error ? error.message : error);
  return new Response(
    JSON.stringify({ error: "Failed to process Perfect Match" }),
    { status: 500, headers: corsHeaders }
  );
}

});
