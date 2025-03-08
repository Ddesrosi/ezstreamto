// Environment variables
export const SUPABASE_URL = "https://acmpivmrokzblypxdxbu.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbXBpdm1yb2t6Ymx5cHhkeGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NDE1OTUsImV4cCI6MjA1NDUxNzU5NX0.nPs1MeO2vH7bh85tvLrH5-jFBCPk9Z1kQMGuZGKmY3s";

export const TMDB_API_KEY = "413cd33f7c45b65014879caead72caba";
export const BMC_SECRET = import.meta.env.VITE_BMC_SECRET;

// API Configuration
export const API_CONFIG = {
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    apiKey: import.meta.env.VITE_TMDB_API_KEY,  // ✅ Dynamically load from .env
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