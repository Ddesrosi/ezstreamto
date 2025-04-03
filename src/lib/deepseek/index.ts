import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster } from '../tmdb';
import { findPerfectMatch } from '../perfect-match';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT, API_CONFIG } from '@/config';
import { fetchMoviesFromTMDB } from '../tmdb';


// Fallback to mock data in development if API key is not available
const MOCK_RESULTS = [
  {
    id: '1',
    title: 'Sample Movie',
    year: 2024,
    rating: 8.5,
    description: 'A sample movie for development.',
    duration: 120,
    language: 'EN',
    genres: ['Action', 'Adventure'],
    imageUrl: API_CONFIG.fallbackImage,
    streamingPlatforms: ['Netflix', 'Amazon Prime']
  }
];

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
    console.log('📝 Built search prompt:', {
      length: prompt.length,
      firstLine: prompt.split('\n')[0]
    });

    // Use TMDB API directly since Deepseek is not available
    console.log('📡 Fetching movies from TMDB...');
    const results = await fetchMoviesFromTMDB(preferences);

    // Handle Perfect Match if enabled
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

        return { results, perfectMatch };
      } catch (error) {
        console.error('❌ Perfect Match error:', error);
        // Continue with regular results if perfect match fails
      }
    }

    console.log('✅ TMDB results:', {
      count: results.length,
      firstMovie: results[0]?.title
    });

    // Slice results based on user limits
    const limitedResults = results.slice(0, preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT);

    console.log('✨ Limited results:', {
      count: limitedResults.length,
      isPremium: preferences.isPremium,
      limit: preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT
    });

    return { results: limitedResults };
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
