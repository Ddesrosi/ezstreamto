import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster } from '../tmdb';
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
    const rawMovies = await fetchMovieListFromDeepseek(prompt);
    console.log(`🎯 Deepseek returned ${rawMovies.length} movie(s)`);

    // 🔍 Enrich results with posters, streaming, trailers, etc.
    const enrichedResults: Movie[] = await Promise.all(
      rawMovies.map((m) => enrichMovieWithPoster(m))
    );

    // 🔎 If Perfect Match is requested
    if (preferences.isPerfectMatch && preferences.isPremium) {
      console.log('🎯 Perfect Match enabled, fetching perfect match...');
      try {
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

        return { results: enrichedResults, perfectMatch };
      } catch (error) {
        console.error('❌ Perfect Match error:', error);
      }
    }

    // ✂️ Slice results depending on user level
    const limit = preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT;
    const finalResults = enrichedResults.slice(0, limit);

    console.log('✅ Final results ready:', {
      count: finalResults.length,
      limit,
      isPremium: preferences.isPremium
    });

    return { results: finalResults };
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

// Types
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
