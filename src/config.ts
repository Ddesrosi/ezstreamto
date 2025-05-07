// Environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY ?? '';
console.log("🧪 DEEPSEEK_API_KEY from config.ts:", DEEPSEEK_API_KEY);

// Import all sensitive keys from .env
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const BMC_SECRET = import.meta.env.VITE_BMC_SECRET;

// TMDB Configuration
export const API_CONFIG = {
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    apiKey: TMDB_API_KEY,
    rateLimit: 40,          // requests
    rateWindow: 10000,      // milliseconds
    timeout: 8000,          // milliseconds
    retries: 3
  },
  fallbackImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&fit=crop&auto=format'
};

// User Limits Configuration
export const USER_LIMITS = {
  basic: {
    SEARCHES_PER_DAY: 5,
    RESULTS_PER_SEARCH: 5
  },
  premium: {
    SEARCHES_PER_DAY: 100,
    RESULTS_PER_SEARCH: 10
  }
};

// Export constants for direct use
export const BASIC_USER_LIMIT = USER_LIMITS.basic.RESULTS_PER_SEARCH;
export const PREMIUM_USER_LIMIT = USER_LIMITS.premium.RESULTS_PER_SEARCH;

// Cache Configuration
export const CACHE_CONFIG = {
  duration: 5 * 60 * 1000, // 5 minutes
  prefix: 'moviemate_'
};
export function getDeepseekApiKey(): string {
  return DEEPSEEK_API_KEY;
}
