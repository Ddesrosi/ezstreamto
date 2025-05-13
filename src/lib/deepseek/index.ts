import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster, FALLBACK_IMAGE } from '../tmdb';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT, getDeepseekApiKey } from '@/config'; 
import { fetchMovieListFromDeepseek } from './deepseek-client';

console.log("🔐 Deepseek API Key used:", getDeepseekApiKey());

class RecommendationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationError';
  }
}

function validatePreferences(preferences: SearchPreferences): void {
  if (!preferences) throw new RecommendationError('Search preferences are required');
  if (!preferences.contentType) throw new RecommendationError('Please select a content type');
  if (preferences.selectedMoods.length === 0 && preferences.selectedGenres.length === 0)
    throw new RecommendationError('At least one mood or genre must be selected');
  if (preferences.yearRange.from > preferences.yearRange.to)
    throw new RecommendationError('Invalid year range');
  if (preferences.ratingRange.min > preferences.ratingRange.max)
    throw new RecommendationError('Invalid rating range');
}

export async function getMovieRecommendations(preferences: SearchPreferences): Promise<{
  results: Movie[];
  remaining?: number;
}> {

  try {
    validatePreferences(preferences);
    console.log('✅ Preferences validated');

    const prompt = buildSearchPrompt(preferences);
    console.log('📝 Prompt sent to Deepseek:', prompt);

    let response;
try {
  response = await fetchMovieListFromDeepseek(prompt);
  console.log("📦 Deepseek response received:", {
    movieCount: response?.rawMovies?.length,
    remaining: response?.remaining
  });

  if (!response?.rawMovies || !Array.isArray(response.rawMovies)) {
    console.error("❌ Invalid response format:", response);
    throw new RecommendationError('Invalid response format from recommendation service');
  }

  if (response.rawMovies.length === 0) {
    console.error("❌ Empty recommendations array");
    throw new RecommendationError('No recommendations found. Please try different preferences.');
  }

} catch (error) {
  console.error("❌ Deepseek API error:", error);
  throw new RecommendationError(
    "We're having trouble getting movie recommendations right now. Please try again in a moment."
  );
}

    const enrichedResults = await Promise.all(
      response.rawMovies.map(async (movie) => {
        try {
          if (!movie?.title) {
            console.warn("⚠️ Skipping movie with missing title:", movie);
            return null;
          }

          const movieWithDefaults = {
            id: crypto.randomUUID(),
            title: movie.title,
            year: movie.year || new Date().getFullYear(),
            rating: movie.rating || 0,
            duration: movie.duration || 'Movie',
            language: movie.language || 'EN',
            genres: Array.isArray(movie.genres) ? movie.genres : [],
            description: movie.description || '',
            imageUrl: movie.imageUrl || FALLBACK_IMAGE,
            streamingPlatforms: []
          };

          return await enrichMovieWithPoster(movieWithDefaults);
        } catch (error) {
          console.error("❌ Failed to enrich movie:", error);
          return null;
        }
      })
    );
    
    const validResults = enrichedResults.filter((movie): movie is Movie => movie !== null);
    
    if (validResults.length === 0) {
      throw new RecommendationError('No valid movie recommendations found');
    }

    const limit = preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT;
    // Sort by popularity before slicing
    const sortedResults = [...validResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const finalResults = sortedResults.slice(0, limit);
   
    console.log('✅ Final results ready:', {
  count: finalResults.length,
  limit
});

    let perfectMatch;

if (preferences.isPerfectMatch && preferences.isPremium) {
  try {
    const sorted = [...validResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const main = sorted[0];
    const similar = sorted.slice(1, 4);

    const explanationPrompt = `
You are an expert in movie recommendations.

🎯 TASK:
Explain in 3 to 4 sentences why the movie "${main.title}" is a perfect match based on the user's preferences.
Keep the tone natural, as if you were speaking to a friend.
Do not mention that you're an AI or repeat the preferences explicitly.

📝 RESPONSE:
A short explanation only. No extra formatting. Do not return JSON.
`.trim();

   const explanationResponse = await 
   fetch("/api/deepseek-proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  
  },
  body: JSON.stringify({
    prompt: explanationPrompt,
    uuid: "perfect-match-explanation"
  })
});

    const explanation = await explanationResponse.text();

    perfectMatch = {
      movie: main,
      insights: {
        reason: explanation.trim(),
        similar
      }
    };

    console.log("✨ Perfect Match generated:", perfectMatch);
  } catch (error) {
    console.error("❌ Perfect Match generation failed:", error);
    perfectMatch = undefined;
  }
}

   return {
  results: finalResults,
  remaining: response.remaining,
  perfectMatch // ✅ Ajout ici
};

  } catch (error) {
    console.error('❌ Movie recommendation error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    if (error instanceof RecommendationError) throw error;
    throw new RecommendationError('Unable to get recommendations. Please try again later.');
  }
}

export interface SearchPreferences {
  contentType: string | null;
  selectedMoods: string[];
  selectedGenres: string[];
  keywords: string[];
  yearRange: {
    from: number;
    to: number;
  };
  specificYear?: number | null;
  ratingRange: {
    min: number;
    max: number;
  };
  isPremium?: boolean;
  }