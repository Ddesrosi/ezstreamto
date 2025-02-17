import { fetchMoviesFromTMDB, enrichMovieWithPoster } from '../tmdb';
import type { Movie } from '@/types';
import { findPerfectMatch } from '../perfect-match';
import { getCachedResult, cacheResult } from './cache';
import { supabase } from '../supabaseClient';
import { buildSearchPrompt } from './promptBuilder';
import type { SearchPreferences } from './types';
import { USER_LIMITS } from '@/config';

// Add error type for better error handling
class RecommendationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationError';
  }
}

// Function to log searches into Supabase with IP-based limits
async function logSearchInSupabase(preferences: SearchPreferences, resultCount: number) {
  try {
    const userIp = await fetchUserIp(); // Récupère la vraie IP
    
    const { data, error } = await supabase
      .from('ip_searches')
      .upsert([
        {
          ip_address: userIp, // Utilise la vraie IP
          search_count: 1,
          last_search: new Date().toISOString(),
          filters: preferences ? JSON.stringify(preferences) : '{}',
          result_count: typeof resultCount === 'number' ? resultCount : 0,
        }
      ], { onConflict: ['ip_address'] });

    if (error) {
      console.error('❌ Erreur lors de l’insertion dans Supabase:', error.message);
    } else {
      console.log('✅ Recherche enregistrée dans Supabase:', data);
    }
  } catch (error) {
    console.error('❌ Erreur inattendue lors de l’enregistrement de la recherche:', error);
  }
}

// Fonction pour récupérer l'IP du visiteur
async function fetchUserIp(): Promise<string> {
  try {
    const response = await fetch('https://api64.ipify.org?format=json');
    const data = await response.json();
    return data.ip; // Retourne la vraie IP publique du visiteur
  } catch (error) {
    console.error('❌ Impossible de récupérer l’IP:', error);
    return 'unknown-ip'; // Valeur de secours
  }
}


// Validate preferences before search
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

  if (preferences.yearRange.from > preferences.yearRange.to) {
    throw new RecommendationError('Invalid year range');
  }

  if (preferences.ratingRange.min > preferences.ratingRange.max) {
    throw new RecommendationError('Invalid rating range');
  }
}

// Generate movie recommendations
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
    validatePreferences(preferences);
    const searchPrompt = buildSearchPrompt(preferences);

    if (import.meta.env.DEV) {
      console.log('Generated Search Prompt:\n', searchPrompt);
    }

    // Vérifier si l'utilisateur peut encore effectuer des recherches
    const isAllowed = await logSearchInSupabase(preferences, 0);
    if (!isAllowed) {
      throw new RecommendationError("⛔ Vous avez atteint votre limite de 5 recherches. Passez en premium pour plus d'accès !");
    }

    // Vérifier la présence en cache
    const cachedResult = await getCachedResult(preferences);
    if (cachedResult) {
      if (import.meta.env.DEV) {
        console.log('Using cached results');
      }
      return cachedResult;
    }

    // Fetch movies from TMDB
    let movies = await fetchMoviesFromTMDB(preferences);

    if (!movies || movies.length === 0) {
      throw new RecommendationError('No movies found matching your preferences.');
    }

    // Score and filter movies
    const scoredMovies = movies.map(movie => ({
      movie,
      score: calculateRelevanceScore(movie, preferences)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

    const maxResults = preferences.isPremium 
      ? USER_LIMITS.premium.resultsPerSearch 
      : USER_LIMITS.basic.resultsPerSearch;

    const limitedResults = scoredMovies.slice(0, maxResults).map(({ movie }) => movie);

    if (import.meta.env.DEV) {
      console.log('Search Results:', {
        total: scoredMovies.length,
        limited: limitedResults.length,
        isPremium: preferences.isPremium,
        maxResults
      });
    }

    const result = { results: limitedResults };

    // Handle perfect match if applicable
    if (preferences.isPerfectMatch && preferences.isPremium && scoredMovies.length > 0) {
      result.perfectMatch = await findPerfectMatch(preferences);
    }

    // Cache the result
    await cacheResult(preferences, result);
    return result;

  } catch (error) {
    console.error('Recommendation system error:', error);
    throw new RecommendationError(error instanceof Error ? error.message : 'An unexpected error occurred.');
  }
}
