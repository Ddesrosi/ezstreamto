import { Movie } from '@/types';
import { enrichMovieWithPoster } from './tmdb';
import { findPerfectMatch, PerfectMatchPreferences } from './perfect-match';
import { getCachedResult, cacheResult } from './cache/deepseek';
import { supabase } from './supabaseClient';

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

// Map moods to genres and themes for better recommendations
const moodGenreMap: Record<string, string[]> = {
  'Happy': ['Comedy', 'Animation', 'Family'],
  'Relaxed': ['Drama', 'Documentary'],
  'Excited': ['Action', 'Adventure', 'Thriller'],
  'Romantic': ['Romance', 'Drama'],
  'Thoughtful': ['Drama', 'Mystery', 'Biography'],
  'Adventurous': ['Adventure', 'Action', 'Fantasy'],
  'Nostalgic': ['Family', 'Musical'],
  'Mysterious': ['Mystery', 'Thriller', 'Crime']
};

// Helper function to calculate relevance score
function calculateRelevanceScore(movie: Movie, preferences: SearchPreferences): number {
  try {
    let score = 0;

    // Content Type Check (Critical)
    if (preferences.contentType === 'movie' && movie.duration.includes('Series') ||
        preferences.contentType === 'tv' && !movie.duration.includes('Series')) {
      return 0;
    }

    // Audience Match (Critical)
    if (preferences.selectedAudience) {
      if (movie.audience === preferences.selectedAudience) {
        score += 10;
      } else if (preferences.selectedAudience === 'family' && 
                ['children', 'family'].includes(movie.audience || '')) {
        score += 8;
      } else {
        return 0; // Disqualify if audience doesn't match
      }
    }

    // Genre Match (High Priority)
    const genreMatches = preferences.selectedGenres.filter(genre => 
      movie.genres.includes(genre)
    ).length;
    score += genreMatches * 5;

    // Mood Match (High Priority)
    const moodScore = preferences.selectedMoods.reduce((acc, mood) => {
      const relevantGenres = moodGenreMap[mood] || [];
      const matches = movie.genres.filter(g => relevantGenres.includes(g)).length;
      return acc + matches * 3;
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

    // Duration Match (Low Priority)
    if (preferences.duration) {
      const duration = parseInt(movie.duration);
      const durationMatch = (
        (preferences.duration === 'Short (< 90min)' && duration < 90) ||
        (preferences.duration === 'Medium (90-120min)' && duration >= 90 && duration <= 120) ||
        (preferences.duration === 'Long (> 120min)' && duration > 120)
      );
      if (durationMatch) {
        score += 2;
      }
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

const BASIC_USER_LIMIT = 5;
const PREMIUM_USER_LIMIT = 10;

async function fetchMoviesFromTMDB(preferences: SearchPreferences): Promise<Movie[]> {
  try {
    const apiKey = API_CONFIG.tmdb.apiKey;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      console.error('TMDB API key is missing or invalid');
      throw new RecommendationError('Movie service configuration error. Please try again later.');
    }

    const TMDB_API_URL = 'https://api.themoviedb.org/3';

    // Build query parameters based on preferences
    const params = new URLSearchParams({
      include_adult: 'false',
      include_video: 'true',
      language: 'en-US',
      page: '1',
      // Fetch enough results to allow for filtering while respecting limits
      per_page: preferences.isPremium ? '50' : '20',
      sort_by: 'popularity.desc',
      'vote_average.gte': preferences.ratingRange.min.toString(),
      'vote_average.lte': preferences.ratingRange.max.toString(),
      'primary_release_date.gte': `${preferences.yearRange.from}-01-01`,
      'primary_release_date.lte': `${preferences.yearRange.to}-12-31`,
    });

    // Add genre filtering if specified
    if (preferences.selectedGenres.length > 0) {
      // Map our genres to TMDB genre IDs
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

      const genreIds = preferences.selectedGenres
        .map(genre => genreMap[genre])
        .filter(Boolean)
        .join(',');

      if (genreIds) {
        params.append('with_genres', genreIds);
      }
    }

    const response = await fetch(
      `${TMDB_API_URL}/discover/${preferences.contentType}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      let errorMessage = `TMDB API error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.status_message || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse TMDB error response:', parseError);
      }
      console.error('TMDB API error:', { status: response.status, message: errorMessage });
      throw new RecommendationError(`Failed to fetch movies: ${errorMessage}`);
    }

    const data = await response.json();
    
    if (!data.results?.length) {
      throw new RecommendationError(
        'No movies found matching your criteria. Try adjusting your filters.'
      );
    }

    if (!Array.isArray(data.results)) {
      console.error('Invalid TMDB response format:', { 
        error: data?.errors || 'Unknown error',
        response: data 
      });
      throw new RecommendationError(
        'Received invalid data from movie service. Please try again.'
      );
    }
    
    // Transform TMDB results to our Movie type
    const movies: Movie[] = await Promise.all(
      data.results.map(async (result: any) => {
        const movie: Movie = {
          id: result.id.toString(),
          title: result.title || result.name,
          year: new Date(result.release_date || result.first_air_date).getFullYear(),
          rating: result.vote_average,
          duration: preferences.contentType === 'movie' ? 'Movie' : 'TV Series',
          language: (result.original_language || 'en').toUpperCase(),
          genres: [], // Will be populated by enrichMovieWithPoster
          description: result.overview,
          imageUrl: result.poster_path 
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
          backdropUrl: result.backdrop_path
            ? `https://image.tmdb.org/t/p/original${result.backdrop_path}`
            : undefined,
          streamingPlatforms: preferences.selectedServices // Will be updated by enrichMovieWithPoster
        };

        // Enrich with additional data
        return await enrichMovieWithPoster(movie);
      })
    );

    return movies;
  } catch (error) {
    console.error('Error fetching movies from TMDB:', error);
    
    if (error instanceof RecommendationError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RecommendationError('Request timed out. Please try again.');
    }
    
    throw new RecommendationError(
      'Unable to fetch movie recommendations. Please try again in a few minutes.'
    );
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

    // Check cache first
    const cachedResult = await getCachedResult(preferences);
    if (cachedResult) {
      console.log('Using cached results');
      return {
        ...cachedResult,
        results: preferences.isPremium 
          ? cachedResult.results 
          : cachedResult.results.slice(0, BASIC_USER_LIMIT)
      };
    }

    console.log('Fetching fresh recommendations...');

    // Fetch movies from TMDB
    const movies = await fetchMoviesFromTMDB(preferences);

    if (movies.length === 0) {
      throw new RecommendationError(
        'No movies found matching your preferences. Try adjusting your filters or try again.'
      );
    }

    // Score and sort movies
    const scoredMovies = movies
      .map(movie => ({
        movie,
        score: calculateRelevanceScore(movie, preferences)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    // Apply result limit based on premium status
    const results = preferences.isPremium 
      ? scoredMovies.slice(0, PREMIUM_USER_LIMIT).map(({ movie }) => movie)
      : scoredMovies.slice(0, BASIC_USER_LIMIT).map(({ movie }) => movie);

    // Handle perfect match
    if (preferences.isPerfectMatch && preferences.isPremium && scoredMovies.length > 0) {
      const perfectMovie = scoredMovies[0].movie;
      
      const genreMatches = preferences.selectedGenres
        .filter(genre => perfectMovie.genres.includes(genre))
        .join(', ');

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
          explanation: `"${perfectMovie.title}" is your perfect match! It's ${audienceDesc} and masterfully combines ${genreMatches} elements that match your preferences. With its ${perfectMovie.rating.toFixed(1)} rating, this ${perfectMovie.year} release captures the ${moodDescription} mood you're looking for.${platformDesc}`,
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

      const result = { results, perfectMatch };
      await cacheResult(preferences, result);
      return result;
    }

    const result = { results };
    await cacheResult(preferences, result);
    return result;
  } catch (error) {
    // Log error for debugging
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    console.error('Recommendation system error:', errorDetails);

    if (error instanceof RecommendationError) {
      throw error;
    } else if (error instanceof Error) {
      throw new RecommendationError(
        `Unable to get recommendations: ${error.message}`
      );
    } else {
      throw new RecommendationError(
        'An unexpected error occurred. Please try again in a few minutes.'
      );
    }
  }
}

export type { SearchPreferences };

interface SearchPreferences {
  contentType: string | null;
  selectedMoods: string[];
  selectedGenres: string[];
  duration: string | null;
  selectedServices: string[];
  selectedAudience: string | null;
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