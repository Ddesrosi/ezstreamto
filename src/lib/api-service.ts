import { createClient } from '@supabase/supabase-js';
import type { Movie } from '@/types';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache configuration
const CACHE_PREFIX = 'moviemate_';
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCacheKey(query: string): string {
  return `${CACHE_PREFIX}movies_${query.toLowerCase().trim()}`;
}

function isValidCache<T>(cache: CacheEntry<T> | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

export async function fetchMoviesWithCache(query: string): Promise<Movie[]> {
  if (!query.trim()) {
    return [];
  }

  // Check cache
  const cacheKey = getCacheKey(query);
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const cache = JSON.parse(cachedData) as CacheEntry<Movie[]>;
      if (isValidCache(cache)) {
        return cache.data;
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
    // Clear invalid cache
    localStorage.removeItem(cacheKey);
  }

  try {
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('rating', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    // Transform data to match Movie type
    const movies: Movie[] = data.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year || new Date().getFullYear(),
      rating: movie.rating || 0,
      duration: movie.duration || 'Unknown',
      language: movie.language || 'English',
      genres: movie.genres || [],
      description: movie.description || '',
      imageUrl: movie.poster_path || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
      backdropUrl: movie.backdrop_path,
      youtubeUrl: movie.youtube_url,
      streamingPlatforms: movie.streaming_platforms || []
    }));

    // Cache the results
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: movies,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Cache write error:', error);
      // If cache fails, clear some space
      clearOldCache();
    }

    return movies;
  } catch (error) {
    console.error('Supabase query error:', error);
    throw new Error('Failed to fetch movies. Please try again.');
  }
}

// Helper function to clear old cache entries
function clearOldCache() {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cache = JSON.parse(localStorage.getItem(key) || '');
          if (!isValidCache(cache)) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Cache cleanup error:', error);
  }
}