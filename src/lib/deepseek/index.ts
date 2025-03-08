import { fetchMoviesFromTMDB } from '../tmdb';
import type { Movie } from '@/types';
import { findPerfectMatch, PerfectMatchPreferences } from '../perfect-match';
import { getCachedResult, cacheResult } from './cache';
import { supabase } from '../supabaseClient';
import type { SearchPreferences } from './types';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT } from '@/config';

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
      console.error(`❌ Erreur lors de l'insertion dans Supabase: ${error.message}`);
    } else {
      console.log('✅ Recherche enregistrée dans Supabase:', data);
    }
  } catch (error) {
    console.error(`❌ Erreur inattendue lors de l'enregistrement de la recherche: ${error}`);
  }
}

// Fonction pour récupérer l'IP du visiteur
async function fetchUserIp(): Promise<string> {
  try {
    const response = await fetch('https://api64.ipify.org?format=json');
    const data = await response.json();
    return data.ip; // Retourne la vraie IP publique du visiteur
  } catch (error) {
    console.error(`❌ Impossible de récupérer l'IP: ${error}`);
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

// Define mood to genre mapping
const moodGenreMap: Record<string, { genres: number[]; keywords: string[] }> = {
  'Dark': {
    genres: [27, 53, 9648], // Horror, Thriller, Mystery
    keywords: ['dark', 'psychological', 'intense', 'atmospheric']
  },
  'Funny': {
    genres: [35, 10751], // Comedy, Family
    keywords: ['comedy', 'humorous', 'light-hearted', 'fun']
  },
  'Epic': {
    genres: [28, 12, 14], // Action, Adventure, Fantasy
    keywords: ['epic', 'grand', 'large-scale', 'spectacular']
  },
  'Heartwarming': {
    genres: [18, 10751], // Drama, Family
    keywords: ['uplifting', 'emotional', 'inspiring', 'feel-good']
  },
  'Happy': {
    genres: [35, 10751], // Comedy, Family
    keywords: ['feel-good', 'uplifting', 'heartwarming']
  },
  'Relaxed': {
    genres: [18, 99], // Drama, Documentary
    keywords: ['slow-paced', 'calm', 'peaceful']
  },
  'Excited': {
    genres: [28, 12], // Action, Adventure
    keywords: ['thrilling', 'fast-paced', 'intense']
  },
  'Romantic': {
    genres: [10749], // Romance
    keywords: ['love', 'romantic', 'relationship']
  },
  'Thoughtful': {
    genres: [18, 9648], // Drama, Mystery
    keywords: ['thought-provoking', 'philosophical', 'deep']
  },
  'Adventurous': {
    genres: [12, 14], // Adventure, Fantasy
    keywords: ['exploration', 'journey', 'quest']
  },
  'Nostalgic': {
    genres: [10751, 10402], // Family, Music
    keywords: ['classic', 'retro', 'timeless']
  },
  'Mysterious': {
    genres: [9648, 53], // Mystery, Thriller
    keywords: ['suspense', 'twist', 'enigmatic']
  }
};

// Define genre mapping
const genreMap: Record<string, number> = {
  'Action': 28,
  'Adventure': 12,
  'Animation': 16,
  'Comedy': 35,
  'Crime': 80,
  'Documentary': 99,
  'Drama': 18,
  'Family': 10751,
  'Fantasy': 14,
  'History': 36,
  'Horror': 27,
  'Music': 10402,
  'Mystery': 9648,
  'Romance': 10749,
  'Science Fiction': 878,
  'Thriller': 53,
  'War': 10752,
  'Western': 37
};

// Helper function to calculate relevance score for a movie based on preferences
function calculateRelevanceScore(movie: Movie, preferences: SearchPreferences): number {
  try {
    let score = 0;

    // Content Type Check (Critical)
    if (preferences.contentType === 'movie' && movie.duration?.toString().toLowerCase().includes('series') ||
        preferences.contentType === 'tv' && !movie.duration?.toString().toLowerCase().includes('series')) {
      return 0;
    }

    // Genre Match (High Priority)
    const genreMatches = preferences.selectedGenres.filter(genre => 
      movie.genres.includes(genre)
    ).length;
    score += genreMatches * 5;

    // Mood Match (High Priority)
    const moodScore = preferences.selectedMoods.reduce((acc, mood) => {
      const moodData = moodGenreMap[mood];
      if (!moodData) return acc;

      // Score based on genre matches
      const matches = movie.genres.filter(g => 
        moodData.genres.includes(genreMap[g])
      ).length;
      
      // Score based on keyword matches in description
      const keywordMatches = moodData.keywords.filter(keyword =>
        movie.description.toLowerCase().includes(keyword.toLowerCase())
      ).length;

      return acc + (matches * 3) + (keywordMatches * 2);
    }, 0);
    score += moodScore;

    // Year Range (Medium Priority)
    if (preferences.specificYear && movie.year === preferences.specificYear) {
      score += 8;
    } else if (movie.year >= preferences.yearRange.from && 
               movie.year <= preferences.yearRange.to) {
      score += 4;
    } else {
      return 0; // Disqualify if outside year range
    }

    // Rating Range (Medium Priority)
    if (movie.rating >= preferences.ratingRange.min && 
        movie.rating <= preferences.ratingRange.max) {
      score += 3;
      // Bonus for highly rated movies
      if (movie.rating >= 8) score += 2;
    } else {
      return 0; // Disqualify if outside rating range
    }

    // Streaming Platform Match (Medium Priority)
    if (preferences.selectedServices.length > 0) {
      const platformMatches = preferences.selectedServices.filter(platform =>
        movie.streamingPlatforms.includes(platform)
      ).length;
      if (platformMatches === 0) {
        return 0; // Disqualify if not available on selected platforms
      }
      score += platformMatches * 2;
    }

    // Keyword Match (Bonus)
    if (preferences.keywords.length > 0) {
      const keywordMatches = preferences.keywords.filter(keyword =>
        movie.title.toLowerCase().includes(keyword.toLowerCase()) ||
        movie.description.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += keywordMatches * 2;
    }

    return score;
  } catch (error) {
    console.error('Error calculating relevance score:', error);
    return 0; // Return 0 score on error to exclude the movie
  }
}

// Helper function to map moods to relevant genres
function getMoodGenres(mood: string): string[] {
  const moodGenreMap: Record<string, { genres: number[]; keywords: string[] }> = {
    'Dark': {
      genres: [27, 53, 9648], // Horror, Thriller, Mystery
      keywords: ['dark', 'psychological', 'intense', 'atmospheric']
    },
    'Funny': {
      genres: [35, 10751], // Comedy, Family
      keywords: ['comedy', 'humorous', 'light-hearted', 'fun']
    },
    'Epic': {
      genres: [28, 12, 14], // Action, Adventure, Fantasy
      keywords: ['epic', 'grand', 'large-scale', 'spectacular']
    },
    'Heartwarming': {
      genres: [18, 10751], // Drama, Family
      keywords: ['uplifting', 'emotional', 'inspiring', 'feel-good']
    },
    'Happy': {
      genres: [35, 10751],
      keywords: ['feel-good', 'uplifting', 'heartwarming']
    },
    'Relaxed': {
      genres: [18],
      keywords: ['slow-paced', 'calm', 'peaceful']
    },
    'Excited': {
      genres: [28, 12],
      keywords: ['thrilling', 'fast-paced', 'intense']
    },
    'Romantic': {
      genres: [10749],
      keywords: ['love', 'romantic', 'relationship']
    },
    'Thoughtful': {
      genres: [18, 9648],
      keywords: ['thought-provoking', 'philosophical', 'deep']
    },
    'Adventurous': {
      genres: [12, 14],
      keywords: ['exploration', 'journey', 'quest']
    },
    'Nostalgic': {
      genres: [],
      keywords: ['classic', 'retro', 'timeless']
    },
    'Mysterious': {
      genres: [9648, 53],
      keywords: ['suspense', 'twist', 'enigmatic']
    }
  };
  return moodGenreMap[mood]?.genres || [];
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

    // Force non-premium features
    preferences.isPremium = false;
    preferences.isPerfectMatch = false;

    // Get user's IP
    const ip = await import('../search-limits').then(m => m.getIP());

    let fetchedMovies: Movie[] = [];
    try {
      const cachedResult = await getCachedResult(preferences);
      if (cachedResult) {
        console.log('📦 Using cached results');
        fetchedMovies = cachedResult.results;
        
        // Log search
        await logSearchInSupabase(preferences, fetchedMovies.length);
      } else {
        console.log('🔍 Fetching fresh results');
        fetchedMovies = await fetchMoviesFromTMDB(preferences);
        
        // Log search
        await logSearchInSupabase(preferences, fetchedMovies.length);
      }
    } catch (error) {
      console.error('Cache/fetch error:', error);
      fetchedMovies = await fetchMoviesFromTMDB(preferences);
      
      // Log search
      await logSearchInSupabase(preferences, fetchedMovies.length);
    }

    if (fetchedMovies.length === 0) {
      throw new RecommendationError(
        'No movies found matching your preferences. Try adjusting your filters or try again.'
      );
    }

    // Score and sort movies
    console.log(`📊 Scoring ${fetchedMovies.length} movies`);
    const scoredMovies = fetchedMovies
      .map(movie => ({
        movie,
        score: calculateRelevanceScore(movie, preferences)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);


    console.log('🏆 Top scored movies:', scoredMovies.slice(0, 3).map(({ movie, score }) => ({
      title: movie.title,
      score,
      genres: movie.genres,
      year: movie.year
    })));
    // Apply result limit based on premium status
    const results = preferences.isPremium 
      ? scoredMovies.slice(0, PREMIUM_USER_LIMIT).map(({ movie }) => movie)
      : scoredMovies.slice(0, BASIC_USER_LIMIT).map(({ movie }) => movie);

    // Handle perfect match
    if (preferences.isPerfectMatch && preferences.isPremium && scoredMovies.length > 0) {
      console.log('🎯 Generating perfect match');

      const perfectMovie = scoredMovies[0].movie;
      
      const matchedGenres = preferences.selectedGenres
        .filter(genre => perfectMovie.genres.includes(genre))
        .join(', ');

      console.log('✨ Perfect match found:', {
        title: perfectMovie.title,
        year: perfectMovie.year,
        genres: perfectMovie.genres,
        rating: perfectMovie.rating
      });

      const moodDescription = preferences.selectedMoods
        .map(mood => mood.toLowerCase())
        .join(' and ');

      const audienceDesc = preferences.selectedAudience 
        ? `perfect for ${preferences.selectedAudience}` 
        : 'suitable for your audience';

      const platformDesc = perfectMovie.streamingPlatforms.length > 0
        ? ` Available on ${perfectMovie.streamingPlatforms.join(' and ')}`
        : '';
        
      const perfectMatch = {
        movie: perfectMovie,
        insights: {
          explanation: `"${perfectMovie.title}" is your perfect match! It's ${audienceDesc} and masterfully combines ${matchedGenres} elements that match your preferences. With its ${perfectMovie.rating.toFixed(1)} rating, this ${perfectMovie.year} release captures the ${moodDescription} mood you're looking for.${platformDesc}`,
          recommendations: scoredMovies
            .slice(1, 4)
            .map(({ movie }) => ({
              title: movie.title,
              reason: `Like ${perfectMovie.title}, ${movie.title} is ${movie.audience === perfectMovie.audience ? 'also ' + audienceDesc : 'similarly engaging'} and excels in ${movie.genres[0].toLowerCase()} storytelling with a ${movie.rating} rating.`,
              imageUrl: movie.imageUrl,
              year: movie.year,
              rating: movie.rating,
              language: movie.language,
              genres: movie.genres,
              youtubeUrl: movie.youtubeUrl
            }))
        }
      };

      // Cache the results with perfect match
      try {
        await cacheResult(preferences, { results, perfectMatch });
      } catch (error) {
        console.warn('Failed to cache results with perfect match:', error);
      }

      return { results, perfectMatch };
    }

    // Cache the results without perfect match
    try {
      await cacheResult(preferences, { results });
    } catch (error) {
      console.warn(`⚠️ Failed to cache results: ${error}`);
    }
    
    return { results };

  } catch (error) {
    console.error(`❌ Recommendation system error: ${error}`);
    throw new RecommendationError(error instanceof Error ? error.message : 'An unexpected error occurred.');
  }
}