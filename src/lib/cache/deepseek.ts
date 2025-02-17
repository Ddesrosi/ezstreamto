import { API_CONFIG } from '../../config';
import { supabase } from '../supabaseClient';
import { CacheError, logError } from '../error-handling';
import type { Movie } from '@/types';
import type { SearchPreferences } from '../deepseek';
import type { PerfectMatchInsights } from '../perfect-match';

interface CachedResult {
  results: Movie[];
  perfectMatch?: {
    movie: Movie;
    insights: PerfectMatchInsights;
  };
}

// Generate a deterministic hash for search preferences using Web Crypto API
async function generatePreferencesHash(preferences: SearchPreferences): Promise<string> {
  try {
    const hashContent = JSON.stringify({
      contentType: preferences.contentType,
      moods: preferences.selectedMoods.sort(),
      genres: preferences.selectedGenres.sort(),
      duration: preferences.duration,
      services: preferences.selectedServices.sort(),
      audience: preferences.selectedAudience,
      keywords: preferences.isPremium ? preferences.keywords.sort() : [],
      yearRange: preferences.yearRange,
      specificYear: preferences.isPremium ? preferences.specificYear : null,
      ratingRange: preferences.ratingRange,
      isPerfectMatch: preferences.isPerfectMatch && preferences.isPremium
    });

    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(hashContent);
    
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Hash generation failed:', error);
    // Fallback to timestamp-based hash
    return `fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

// Check if a cached result exists and is valid
export async function getCachedResult(
  preferences: SearchPreferences
): Promise<CachedResult | null> {
  try {
    // In development mode, skip caching
    if (import.meta.env.DEV) {
      return null;
    }

    const hash = await generatePreferencesHash(preferences);

    // Use RPC call instead of direct query for better error handling
    const { data, error } = await supabase.rpc('get_cached_results', {
      p_hash: hash
    });

    if (error) {
      // Log error but don't throw - allow fallback to fresh results
      console.warn('Cache lookup failed:', error.message);
      return null;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const cache = data[0];

    return {
      results: cache.results || [],
      ...(cache.perfect_match && {
        perfectMatch: {
          movie: cache.perfect_match.movie,
          insights: cache.perfect_match.insights
        }
      })
    };
  } catch (error) {
    // Log error but don't throw - allow fallback to fresh results
    logError(error, 'Cache Lookup');
    return null;
  }
}

// Store a new result in the cache
export async function cacheResult(
  preferences: SearchPreferences,
  result: CachedResult
): Promise<void> {
  try {
    // In development mode, skip caching
    if (import.meta.env.DEV) {
      return;
    }

    const hash = await generatePreferencesHash(preferences);
    
    // Use RPC call instead of direct query
    const { error } = await supabase.rpc('store_cache_result', {
      p_hash: hash,
      p_results: result.results,
      p_perfect_match: result.perfectMatch ? {
        movie: result.perfectMatch.movie,
        insights: result.perfectMatch.insights
      } : null
    });

    if (error) {
      // Log error but don't throw - caching failure shouldn't break the app
      console.warn('Cache storage failed:', error.message);
    }
  } catch (error) {
    // Log error but don't throw - caching failure shouldn't break the app
    logError(error, 'Cache Storage');
  }
}