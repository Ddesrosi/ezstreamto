import type { Movie } from '../_shared/types.ts';
import type { SearchPreferences } from '../_shared/deepseek/types.ts';
import { enrichMovieWithPoster } from '../_shared/tmdb.ts';

export async function findPerfectMatchMovie(preferences: SearchPreferences): Promise<Movie | undefined> {
  console.log("🎯 [Backend] Finding perfect match movie with:", preferences);

  try {
    const response = await fetch('https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences })
    });

    if (!response.ok) {
      console.warn("⚠️ Deepseek call failed with status:", response.status);
      return undefined;
    }

    const raw = await response.json();
    const results = raw.results || [];

    console.log("📊 Deepseek results received:", results);

    const bestMovie = results[0];
    if (!bestMovie || !bestMovie.title) {
      console.warn("⚠️ No valid result returned from Deepseek.");
      return undefined;
    }

    const enriched = await enrichMovieWithPoster(bestMovie);
    return enriched;
  } catch (err) {
    console.error("❌ Error in findPerfectMatchMovie:", err);
    return undefined;
  }
}
