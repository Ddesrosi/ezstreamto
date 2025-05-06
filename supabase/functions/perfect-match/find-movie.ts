import { findMoviesFromDeepseek } from "@/lib/deepseek/deepseek-client";
import { enrichMovieWithPoster } from "@/lib/tmdb";
import type { SearchPreferences, Movie } from "@/types";

/**
 * Fonction appelée par l'Edge Function "perfect-match"
 * Elle récupère un film principal basé sur les préférences réelles
 */
export async function findPerfectMatchMovie(preferences: SearchPreferences): Promise<Movie> {
  console.log("🎯 [findPerfectMatchMovie] Preferences:", preferences);

  try {
    const results = await findMoviesFromDeepseek(preferences);

    console.log("🎬 [findPerfectMatchMovie] Raw results:", results);

    if (!results || results.length === 0) {
      throw new Error("No results from Deepseek");
    }

    const main = results[0];
    const enriched = await enrichMovieWithPoster(main);

    console.log("✅ [findPerfectMatchMovie] Enriched main movie:", enriched);

    return enriched;
  } catch (err) {
    console.error("❌ [findPerfectMatchMovie] Error:", err);
    throw err;
  }
}
