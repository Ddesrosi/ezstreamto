import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster, FALLBACK_IMAGE } from '../tmdb';
import { findPerfectMatch } from '../perfect-match';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT } from '@/config';
import { fetchMovieListFromDeepseek } from './deepseek-client';

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
  perfectMatch?: any;
  remaining?: number;
}> {
  console.log('🎬 Starting movie recommendations:', {
    contentType: preferences.contentType,
    moods: preferences.selectedMoods,
    genres: preferences.selectedGenres,
    isPremium: preferences.isPremium,
    isPerfectMatch: preferences.isPerfectMatch
  });

  try {
    validatePreferences(preferences);
    console.log('✅ Preferences validated:', {
      contentType: preferences.contentType,
      moods: preferences.selectedMoods.length,
      genres: preferences.selectedGenres.length,
      isPerfectMatch: preferences.isPerfectMatch
    });

    const prompt = buildSearchPrompt(preferences);
    console.log('📝 Prompt sent to Deepseek:\n' + prompt);
    console.log('🔑 Keywords:', preferences.keywords);

    // 🔄 Fetch raw movies from Deepseek AI

    console.log("📨 Prompt sent to Deepseek:", prompt);

    if (preferences.isPerfectMatch && preferences.isPremium) {
  console.log('🎯 Perfect Match enabled, skipping Deepseek standard call');
  const perfectMatch = await findPerfectMatch({
    contentType: preferences.contentType,
    genres: preferences.selectedGenres,
    moods: preferences.selectedMoods,
    yearRange: preferences.yearRange,
    ratingRange: preferences.ratingRange
  });

  console.log('✨ Perfect Match found:', {
    title: perfectMatch.movie.title,
    hasInsights: !!perfectMatch.insights,
    recommendationsCount: perfectMatch.insights?.recommendations?.length
  });

  return {
    results: [],
    perfectMatch,
    remaining: preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT
  };
}

    const response = await fetchMovieListFromDeepseek(prompt);

    console.log("🪵 Deepseek full response:", response);
console.log("🪵 rawText:", response?.rawText);

    if (!response || !response.rawMovies) {
      console.error('❌ Invalid response structure:', response);
      throw new RecommendationError('Invalid response from Deepseek: Missing movie data');
    }

    if (!Array.isArray(response.rawMovies)) {
      console.error('❌ Invalid movies data type:', typeof response.rawMovies);
      throw new RecommendationError('Invalid response from Deepseek: Movie data is not an array');
    }

    console.log("📦 Response received from Deepseek:", {
      movieCount: response.rawMovies.length,
      remaining: response.remaining,
      isPremium: response.isPremium
    });

    // 🔍 Enrich results with posters, streaming, trailers, etc.
    const enrichedResults = await Promise.all(
      response.rawMovies.map(async (movie) => {
        const movieWithDefaults = {
          id: crypto.randomUUID(),
          title: movie.title,
          year: movie.year || new Date().getFullYear(),
          rating: movie.rating || 0,
          duration: movie.duration || 'Movie',
          language: movie.language || 'EN',
          genres: movie.genres || [],
          description: movie.description || '',
          imageUrl: movie.imageUrl || FALLBACK_IMAGE,
          streamingPlatforms: []
        };

        return enrichMovieWithPoster(movieWithDefaults);
      })
    );

   
    const limit = preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT;
    const finalResults = enrichedResults.slice(0, limit);

    console.log('✅ Final results ready:', {
      count: finalResults.length,
      limit,
      isPremium: preferences.isPremium
    });

    return {
      results: finalResults,
      remaining: response.remaining
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
  isPerfectMatch?: boolean;
}
