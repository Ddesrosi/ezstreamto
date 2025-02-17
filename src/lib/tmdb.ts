import { API_CONFIG } from '@/config';
import { Movie } from '@/types';
import pLimit from 'p-limit';
import { genreMap, mapTMDBGenres } from './constants/genres';
import type { SearchPreferences } from './deepseek/types';

// Constants
const TMDB_API_URL = API_CONFIG.tmdb.baseUrl;
const TMDB_IMAGE_URL = `${API_CONFIG.tmdb.imageBaseUrl}/w500`;
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';

// Rate limiting configuration
const RATE_LIMIT = 40;
const RATE_WINDOW = 10000;
const limit = pLimit(5);

const requestQueue: { timestamp: number }[] = [];

async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  requestQueue.push({ timestamp: now });
  
  while (requestQueue.length > 0 && now - requestQueue[0].timestamp > RATE_WINDOW) {
    requestQueue.shift();
  }
  
  if (requestQueue.length > RATE_LIMIT) {
    const oldestRequest = requestQueue[0].timestamp;
    const waitTime = RATE_WINDOW - (now - oldestRequest);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  await checkRateLimit();
  
  // Add API key to URL
  const separator = url.includes('?') ? '&' : '?';
  const urlWithKey = `${url}${separator}api_key=${API_CONFIG.tmdb.apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await limit(async () => {
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
        }
      };

      return await fetch(urlWithKey, fetchOptions);
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'TMDB API Error';
      try {
        const errorData = await response.json();
        console.error('TMDB API Error:', { 
          status: response.status, 
          message: errorData?.status_message || errorData?.message,
          details: errorData
        });
        errorMessage = errorData?.status_message || `HTTP error ${response.status}`;
        console.error('TMDB API Error:', {
          status: response.status,
          message: errorMessage,
          url: url
        });
      } catch (parseError) {
        console.error('Failed to parse TMDB error response:', parseError);
        console.error('Failed to parse TMDB error response:', parseError);
        errorMessage = `HTTP error ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      console.error('TMDB API Error:', error);

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
    }
    
    throw error;
  }
}

// Helper function to get watch providers
async function getWatchProviders(mediaType: string, id: string): Promise<string[]> {
  try {
    const response = await fetchWithRetry(
      `${TMDB_API_URL}/${mediaType}/${id}/watch/providers`
    );
    const data = await response.json();
    
    // Get US providers (fallback to GB if US not available)
    const providers = data.results?.US || data.results?.GB;
    if (!providers) return [];

    // Combine flatrate, free, and ads providers
    const allProviders = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
      ...(providers.rent || []),
      ...(providers.buy || [])
    ];

    // Map TMDB provider names to our platform names
    const providerMap: Record<string, string> = {
      'Netflix': 'Netflix',
      'Amazon Prime Video': 'Amazon Prime',
      'Prime Video': 'Amazon Prime',
      'Disney Plus': 'Disney+',
      'Disney+': 'Disney+',
      'HBO Max': 'HBO Max',
      'Max': 'HBO Max',
      'Apple TV Plus': 'Apple TV+',
      'Apple TV': 'Apple TV+',
      'Apple TV+': 'Apple TV+',
      'Hulu': 'Hulu',
      'Paramount Plus': 'Paramount+',
      'Paramount+': 'Paramount+',
      'Peacock': 'Peacock'
    };

    const platforms = [...new Set(
      allProviders
        .map(p => providerMap[p.provider_name])
        .filter(Boolean)
    )];

    if (import.meta.env.DEV) {
      console.log('Watch providers for:', id, {
        raw: allProviders.map(p => p.provider_name),
        mapped: platforms
      });
    }

    return platforms;
  } catch (error) {
    console.warn('Failed to fetch watch providers:', error);
    return [];
  }
}

export async function enrichMovieWithPoster(movie: Movie): Promise<Movie> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const searchUrl = new URL(`${TMDB_API_URL}/search/multi`);
    searchUrl.searchParams.append('query', movie.title);
    if (movie.year) {
      searchUrl.searchParams.append('year', movie.year.toString());
    }
    searchUrl.searchParams.append('include_adult', 'false');
    searchUrl.searchParams.append('language', 'en-US');

    try {
      const response = await fetchWithRetry(searchUrl.toString());
      clearTimeout(timeoutId);

      const data = await response.json();

      const match = data.results?.find((r: any) => {
        if (!r || !['movie', 'tv'].includes(r.media_type)) return false;
        
        const resultTitle = (r.title || r.name || '').toLowerCase().trim();
        const movieTitle = movie.title.toLowerCase().trim();
        
        if (resultTitle === movieTitle) return true;
        
        if (resultTitle.includes(movieTitle) || movieTitle.includes(resultTitle)) {
          if (movie.year) {
            const resultYear = new Date(r.release_date || r.first_air_date || '').getFullYear();
            return resultYear === movie.year;
          }
          return true;
        }
        
        return false;
      });

      if (!match) {
        return {
          ...movie,
          imageUrl: FALLBACK_IMAGE,
          youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`
        };
      }

      // Get additional details including videos and watch providers
      const detailsUrl = `${TMDB_API_URL}/${match.media_type}/${match.id}?append_to_response=videos`;
      const detailsResponse = await fetchWithRetry(detailsUrl);
      const details = await detailsResponse.json();

      // Get watch providers
      const providers = await getWatchProviders(match.media_type, match.id);

      // Find trailer
      const trailer = details.videos?.results?.find(
        (video: any) => video?.site === 'YouTube' && 
          (video.type === 'Trailer' || video.type === 'Teaser')
      );

      return {
        ...movie,
        imageUrl: match.poster_path
          ? `${TMDB_IMAGE_URL}/${match.poster_path}`
          : FALLBACK_IMAGE,
        backdropUrl: match.backdrop_path
          ? `https://image.tmdb.org/t/p/original${match.backdrop_path}`
          : undefined,
        youtubeUrl: trailer
          ? `https://www.youtube.com/watch?v=${trailer.key}`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`,
        // Merge existing platforms with TMDB providers
        streamingPlatforms: [...new Set([
          ...movie.streamingPlatforms,
          ...providers
        ])]
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error(`Error enriching movie "${movie.title}":`, error);
    return {
      ...movie,
      imageUrl: FALLBACK_IMAGE,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`
    };
  }
}

// Export the fetchMoviesFromTMDB function
export async function fetchMoviesFromTMDB(preferences: SearchPreferences): Promise<Movie[]> {
  try {
    if (!preferences.contentType) {
      throw new Error('Content type is required');
    }

    // Debug logging
    console.log('TMDB API Request:', {
      contentType: preferences.contentType,
      genres: preferences.selectedGenres,
      yearRange: preferences.yearRange,
      ratingRange: preferences.ratingRange
    });

    const queryParams = new URLSearchParams({
      'include_adult': 'false',
      'language': 'en-US',
      'page': '1',
      'sort_by': 'popularity.desc',
      'vote_count.gte': '100',
      'vote_average.gte': (preferences.ratingRange.min - 0.5).toString(), // Slightly expand range
      'vote_average.lte': (preferences.ratingRange.max + 0.5).toString(),
      'primary_release_date.gte': `${preferences.yearRange.from - 1}-01-01`, // Slightly expand range
      'primary_release_date.lte': `${preferences.yearRange.to + 1}-12-31`,
    });

    // Add genre filtering if specified
    if (preferences.selectedGenres.length > 0) {
      // Use all selected genres for better accuracy
      const genreIds = preferences.selectedGenres
        .slice(0, 2) // Limit to 2 genres for better results
        .map(genre => {
          const id = genreMap[genre];
          if (!id) {
            console.warn(`No TMDB genre ID found for: ${genre}`);
          }
          return id;
        })
        .filter(Boolean)
        .join(',');

      if (genreIds) {
        queryParams.append('with_genres', genreIds);
      }
    }

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('TMDB API Query:', {
        endpoint: `${TMDB_API_URL}/discover/${preferences.contentType}`,
        params: Object.fromEntries(queryParams.entries())
      });
    }

    // Add more flexibility to the query
    if (!preferences.selectedGenres.length) {
      // If no genres selected, don't filter by genre
      queryParams.delete('with_genres');
    }

    // Expand year range slightly to get more results
    const yearPadding = 2;
    queryParams.set('primary_release_date.gte', 
      `${preferences.yearRange.from - yearPadding}-01-01`);
    queryParams.set('primary_release_date.lte', 
      `${preferences.yearRange.to + yearPadding}-12-31`);

    // Lower minimum vote count for more results
    queryParams.set('vote_count.gte', '50');

    // Fetch from TMDB
    const response = await fetchWithRetry(
      `${TMDB_API_URL}/discover/${preferences.contentType}?${queryParams.toString()}`
    );

    const data = await response.json();

    // If no results, try a more relaxed search
    if (!data.results?.length) {
      // Remove genre filter
      queryParams.delete('with_genres');
      // Lower rating requirements
      queryParams.set('vote_count.gte', '20');
      
      const relaxedResponse = await fetchWithRetry(
        `${TMDB_API_URL}/discover/${preferences.contentType}?${queryParams.toString()}`
      );
      const relaxedData = await relaxedResponse.json();
      
      if (!relaxedData.results?.length) {
        throw new Error('No movies found matching your criteria. Try adjusting your filters.');
      }
      
      data.results = relaxedData.results;
    }
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('TMDB API Response:', {
        totalResults: data.total_results,
        page: data.page,
        totalPages: data.total_pages,
        resultCount: data.results?.length,
        firstResult: data.results?.[0]?.title
      });
    }

    if (!data.results?.length) {
      throw new Error('No movies found matching your criteria. Try adjusting your filters.');
    }

    // Transform to our Movie type
    const movies: Movie[] = data.results.map((result: any) => ({
      id: result.id.toString(),
      title: result.title || result.name,
      year: new Date(result.release_date || result.first_air_date).getFullYear(),
      rating: result.vote_average,
      duration: preferences.contentType === 'movie' ? 'Movie' : 'TV Series',
      language: (result.original_language || 'en').toUpperCase(),
      genres: mapTMDBGenres(result.genre_ids || []),
      description: result.overview,
      imageUrl: result.poster_path 
        ? `${TMDB_IMAGE_URL}${result.poster_path}`
        : FALLBACK_IMAGE,
      backdropUrl: result.backdrop_path
        ? `https://image.tmdb.org/t/p/original${result.backdrop_path}`
        : undefined,
      streamingPlatforms: []
    }));

    // Enrich movies with additional data
    const enrichedMovies = await Promise.all(
      movies.map(movie => enrichMovieWithPoster(movie))
    );

    if (import.meta.env.DEV) {
      console.log('Successfully processed movies:', {
        count: enrichedMovies.length,
        firstMovie: enrichedMovies[0]?.title,
        firstMovieGenres: enrichedMovies[0]?.genres
      });
    }

    return enrichedMovies;
  } catch (error) {
    console.error('TMDB API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}