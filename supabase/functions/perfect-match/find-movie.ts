import type { Movie } from '../_shared/types.ts';
import type { SearchPreferences } from '../_shared/deepseek/types.ts';
import { getMovieRecommendations } from '../_shared/deepseek/index.ts';
import { enrichMovieWithPoster } from '../_shared/tmdb.ts';

export async function findPerfectMatchMovie(preferences: SearchPreferences): Promise<Movie | undefined> {
  console.log("🎯 [Backend] Finding perfect match movie with:", preferences);

  try {
    const results = await getMovieRecommendations(preferences);
    console.log("📊 Deepseek results received:", results);

    const bestMovie = results?.[0];

    if (!bestMovie || !bestMovie.title) {
      console.warn("⚠️ No valid result returned from Deepseek.");
      return undefined;
    }

    const movie: Movie = {
      id: crypto.randomUUID(),
      title: bestMovie.title,
      year: bestMovie.year || new Date().getFullYear(),
      rating: bestMovie.rating || 0,
      duration: bestMovie.duration || (preferences.contentType === 'tv' ? 'TV Series' : '120 min'),
      language: bestMovie.language || 'EN',
      genres: bestMovie.genres || [],
      description: bestMovie.description || '',
      imageUrl: '',
      streamingPlatforms: []
    };

    const enriched = await enrichMovieWithPoster(movie);
    return enriched;

  } catch (err) {
    console.error("❌ Error in findPerfectMatchMovie:", err);
    return undefined;
  }
}
