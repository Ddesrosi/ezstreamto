import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import type { SearchPreferences } from '../_shared/deepseek/types.ts';
import { findPerfectMatchMovie } from "./find-movie.ts";
import { generatePerfectMatchInsights } from "./insights.ts";
import { enrichMovieWithPoster } from "../_shared/tmdb.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders });
  }

  const body = await req.json();

  try {
    console.log("🚀 Perfect Match Edge Function triggered");

    const preferences: SearchPreferences = body.preferences;

    const movie = await findPerfectMatchMovie(preferences);
    console.log("📽️ Movie fetched from findPerfectMatchMovie():", movie);

    const enrichedMovie = await enrichMovieWithPoster(movie);
    console.log("🖼️ Enriched movie:", enrichedMovie);

    console.log("🧪 Movie before insights:", enrichedMovie);

    console.log("🎯 Calling generatePerfectMatchInsights with:", {
      selectedMovie: movie,
      preferences
    });

    const insights = await generatePerfectMatchInsights(enrichedMovie, preferences);

    if (!movie || !insights) {
      console.warn("⚠️ Fallback triggered — missing movie or insights");
      return new Response(JSON.stringify({
        movie: {
          title: "The Matrix",
          year: 1999,
          rating: 8.7,
          duration: 136,
          language: "EN",
          genres: ["Sci-Fi", "Action"],
          description: "A computer programmer discovers a mysterious world.",
          imageUrl: "",
          streamingPlatforms: []
        },
        insights: {
          explanation: "Fallback suggestion due to technical issues.",
          recommendations: []
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
 
    return new Response(
      JSON.stringify({ movie: enrichedMovie, insights }),
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