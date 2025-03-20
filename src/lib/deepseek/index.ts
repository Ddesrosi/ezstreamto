import { fetchMoviesFromTMDB } from '../tmdb';
import type { Movie } from '@/types';
import { findPerfectMatch, PerfectMatchPreferences } from '../perfect-match';
import { supabase } from '../supabaseClient';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT, DEEPSEEK_CONFIG } from '@/config';

// Add error type for better error handling
class RecommendationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationError';
  }
}

// Helper function to validate preferences
function validatePreferences(preferences: SearchPreferences): void {
  if (!preferences) {
    throw new RecommendationError('Search preferences are required');
  }

  if (!preferences.contentType) {
    throw new RecommendationError('Please select a content type (Movie or TV Series)');
  }

  if (preferences.selectedMoods.length === 0 && preferences.selectedGenres.length === 0) {
    throw new RecommendationError('Please select at least one mood or genre');
  }

  // Validate year range
  if (preferences.yearRange.from > preferences.yearRange.to) {
    throw new RecommendationError('Invalid year range');
  }

  // Validate rating range
  if (preferences.ratingRange.min > preferences.ratingRange.max) {
    throw new RecommendationError('Invalid rating range');
  }
}

export async function getMovieRecommendations(preferences: SearchPreferences): Promise<{
  results: Movie[];
  perfectMatch?: {
    movie: Movie;
    insights: {
      explanation: string;
      recommendations: { 
        title: string; 
        reason: string;
        imageUrl?: string;
        year?: number;
        rating?: number;
        language?: string;
        genres?: string[];
        youtubeUrl?: string;
      }[];
    };
  };
}> {
  try {
    // Add request validation
    if (!preferences) {
      throw new RecommendationError('Search preferences are required');
    }

    // Validate preferences first
    validatePreferences(preferences);

    // Force non-premium features for now
    preferences.isPremium = false;
    preferences.isPerfectMatch = false;

    // Fetch movies from TMDB
    const movies = await fetchMoviesFromTMDB(preferences);

    if (movies.length === 0) {
      throw new RecommendationError(
        'No movies found matching your preferences. Try adjusting your filters or try again.'
      );
    }

    // Score and sort movies
    const scoredMovies = movies
      .sort((a, b) => b.rating - a.rating)
      .slice(0, preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT);

    return { results: scoredMovies };

  } catch (error) {
    console.error('Recommendation system error:', error);
    
    if (error instanceof RecommendationError) {
      throw error;
    }
    
    throw new RecommendationError(
      'Unable to get recommendations. Please try again in a few minutes.'
    );
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