import { findMoviesFromDeepseek } from "@/lib/deepseek/deepseek-client";
import { enrichMovieWithPoster } from "@/lib/tmdb";
import type { SearchPreferences, Movie } from "@/types";

/**
 * Fonction appelée par l'Edge Function "perfect-match"
 * Elle récupère un film principal basé sur les préférences réelles
 */
export async function findPerfectMatchMovie(preferences: SearchPreferences): Promise<{
  movie: Movie;
  insights: {
    reason: string;
    similar: Movie[];
  };
}> {
  console.log("🎯 [findPerfectMatchMovie] Preferences:", preferences);

  try {
    const results = await findMoviesFromDeepseek(preferences);

    console.log("🎬 [findPerfectMatchMovie] Raw results:", results);

    if (!results || results.length === 0) {
      throw new Error("No results from Deepseek");
    }

    const main = await enrichMovieWithPoster(results[0]);

    const similar = await Promise.all(
      results.slice(1, 4).map(enrichMovieWithPoster)
    );

    const insights = {
      reason: "This movie matches your selected moods and genres.",
      similar
    };

    return {
      movie: main,
      insights
    };
  } catch (err) {
    console.error("❌ [findPerfectMatchMovie] Error:", err);
    throw err;
  }
}
