// Validate environment variables
if (!import.meta.env.VITE_TMDB_API_KEY) {
  throw new Error('TMDB API key is not configured');
}
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Supabase configuration is missing');
}
// Environment variables
export const SUPABASE_URL = "https://acmpivmrokzblypxdxbu.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbXBpdm1yb2t6Ymx5cHhkeGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NDE1OTUsImV4cCI6MjA1NDUxNzU5NX0.nPs1MeO2vH7bh85tvLrH5-jFBCPk9Z1kQMGuZGKmY3s";

export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const BMC_SECRET = import.meta.env.VITE_BMC_SECRET;

// API Configuration
export const API_CONFIG = {
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    apiKey: TMDB_API_KEY,
    rateLimit: 40, // requests
    rateWindow: 10000, // milliseconds
    timeout: 8000, // milliseconds
    retries: 3
  },
  fallbackImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba'
};

// User Limits Configuration
export const USER_LIMITS = {
  basic: {
    searchesPerDay: 5,
    resultsPerSearch: 5
  },
  premium: {
    searchesPerDay: 100,
    resultsPerSearch: 10
  }
};

// Cache Configuration
export const CACHE_CONFIG = {
  duration: 5 * 60 * 1000, // 5 minutes
  prefix: 'moviemate_'
};