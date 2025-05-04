import { API_CONFIG } from '../_shared/config.ts';
import type { Movie } from '../_shared/types.ts';
import { mapTMDBGenres, genreMap } from './constants/genres.ts';
import type { SearchPreferences } from './deepseek/types.ts';
import { RateLimiter } from './utils/rate-limiter.ts';
import { retryWithBackoff } from './utils/retry.ts';

export const FALLBACK_IMAGE = API_CONFIG.fallbackImage;

console.log('🔍 TMDB Config:', {
  imageBaseUrl: API_CONFIG.tmdb.imageBaseUrl,
  fallbackImage: API_CONFIG.fallbackImage
});

// Helper function to build TMDB image URL
export function buildImageUrl(path: string | null | undefined, size: string = 'w500'): string {
  console.log('🖼️ Building image URL:', { path, size });
  if (!path) return API_CONFIG.fallbackImage;
  
  // Ensure path starts with '/'
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_CONFIG.tmdb.imageBaseUrl}/${size}${cleanPath}`;
  
  console.log('🔗 Generated image URL:', fullUrl);
  return fullUrl;
}

// Helper function to get trailer URL
function getTrailerUrl(details: any): string {
  const trailer = details.videos?.results?.find(
    (video: any) => video?.site === 'YouTube' && 
      (video.type === 'Trailer' || video.type === 'Teaser')
  );
  return trailer
    ? `https://www.youtube.com/watch?v=${trailer.key}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details.title || ''} trailer`)}`;
}

console.log('🔍 Initializing TMDB API client');

const rateLimiter = new RateLimiter(
  API_CONFIG.tmdb.rateLimit,
  API_CONFIG.tmdb.rateWindow
);

interface TMDBRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

async function tmdbRequest<T>(
  endpoint: string,
  options: TMDBRequestOptions = {}
): Promise<T | null> {
  const apiKey = API_CONFIG.tmdb.apiKey;
  const {
    timeout = API_CONFIG.tmdb.timeout,
    retries = API_CONFIG.tmdb.retries,
    ...fetchOptions
  } = options;

  if (!apiKey) {
    throw new Error('TMDB API key is not configured');
  }

  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${API_CONFIG.tmdb.baseUrl}${endpoint}${separator}api_key=${apiKey}`;

  const makeRequest = async () => {
    await rateLimiter.acquire();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${API_CONFIG.tmdb.apiKey}`,
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        // Check for 404 specifically
        if (response.status === 404) {
          console.warn('🚫 TMDB resource not found:', url);
          return null; // Signal that the resource was not found
        }
        console.error('❌ TMDB API error:', {
          status: response.status,
          url: url.replace(API_CONFIG.tmdb.apiKey, '[REDACTED]')
        });
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
  return retryWithBackoff(makeRequest, {
    maxRetries: retries,
    baseDelay: 1000,
    maxDelay: 5000
  });
}

export async function fetchMoviesFromTMDB(preferences: SearchPreferences): Promise<Movie[]> {
  try {
    console.log('🔍 Fetching movies from TMDB with preferences:', preferences);
    
    if (!preferences.selectedGenres.length && !preferences.selectedMoods.length) {
      throw new Error('Please select at least one genre or mood');
    }

    const contentType = preferences.contentType === 'tv' ? 'tv' : 'movie';
    const genreIds = preferences.selectedGenres
      .map(genre => genreMap[genre] || null)
      .filter(Boolean)
      .join(',');
      
    // Add mood-based genre mapping
    const moodGenreIds = preferences.selectedMoods
      .flatMap(mood => {
        if (!mood) return [];
        
        switch (mood.toString().toLowerCase()) {
          case 'happy': return [35, 10751]; // Comedy, Family
          case 'relaxed': return [18, 99]; // Drama, Documentary
          case 'excited': return [28, 12]; // Action, Adventure
          case 'romantic': return [10749]; // Romance
          case 'thoughtful': return [18, 9648]; // Drama, Mystery
          case 'adventurous': return [12, 14]; // Adventure, Fantasy
          case 'mysterious': return [9648, 53]; // Mystery, Thriller
          default: return [];
        }
      })
      .filter(Boolean)
      .join(',');

    const allGenreIds = [...new Set([...genreIds.split(','), ...moodGenreIds.split(',')])]
      .filter(Boolean)
      .join(',');
    
    // Initial search parameters with strict criteria
    const params = new URLSearchParams({
      include_adult: 'false',
      include_video: 'true',
      language: 'en-US',
      page: '1',
      sort_by: 'popularity.desc',
      'vote_average.gte': preferences.ratingRange?.min?.toString() || '0',
      'vote_average.lte': preferences.ratingRange?.max?.toString() || '10',
      'primary_release_date.gte': preferences.yearRange?.from ? `${preferences.yearRange.from}-01-01` : '1920-01-01',
      'primary_release_date.lte': preferences.yearRange?.to ? `${preferences.yearRange.to}-12-31` : '2025-12-31',
      'vote_count.gte': '50'
    });

    if (allGenreIds) {
      params.append('with_genres', allGenreIds);
    }

    console.log('🛠️ TMDB Query Parameters:', Object.fromEntries(params.entries()));
    
    const fetchPages = async () => {
      const results = [];
      let totalPages = 0;
      let attempts = 0;
      const maxAttempts = 3;

      for (let page = 1; page <= 3; page++) {
        try {
          const data = await tmdbRequest(`/discover/${contentType}?${params.toString()}&page=${page}`);
          if (data.results?.length) {
            results.push(...data.results);
            totalPages++;
          }
        } catch (err) {
          console.warn(`Failed to fetch page ${page}:`, err);
          continue;
        }
      }
      return { results, totalPages };
    };

    // Try initial search with strict criteria
    let { results: allResults, totalPages } = await fetchPages();
    console.log(`📊 Initial search found ${allResults.length} results`);

    if (allResults.length === 0) {
      console.log('🔄 No results found, trying with relaxed criteria...');
      
      // First relaxation: Remove vote count requirement
      params.delete('vote_count.gte');
      
      let { results: relaxedResults } = await fetchPages();
      
      // If still no results, try without genre restrictions
      if (relaxedResults.length === 0 && allGenreIds) {
        console.log('🔄 Still no results, trying without genre restrictions...');
        params.delete('with_genres');
        const { results: noGenreResults } = await fetchPages();
        relaxedResults = noGenreResults;
      }
      
      // If still no results, try with expanded year range
      if (relaxedResults.length === 0) {
        console.log('🔄 Expanding year range...');
        params.set('primary_release_date.gte', '1900-01-01');
        params.set('primary_release_date.lte', new Date().getFullYear().toString() + '-12-31');
        const { results: expandedResults } = await fetchPages();
        relaxedResults = expandedResults;
      }
      
      if (relaxedResults.length === 0) {
        throw new Error(
          'We could not find any movies matching your criteria. Please try:\n' +
          '• Selecting different genres or moods\n' +
          '• Expanding your year range\n' +
          '• Adjusting your rating requirements'
        );
      }
      
      allResults = relaxedResults;
      console.log(`✅ Found ${allResults.length} results with relaxed criteria`);
    }

    // Ensure we have enough results
    const minResults = preferences.isPremium ? 10 : 5;
    if (allResults.length < minResults) {
      console.log(`⚠️ Not enough results (${allResults.length}), fetching more...`);
      params.delete('vote_average.gte');
      params.delete('vote_average.lte');
      const { results: additionalResults } = await fetchPages();
      // Ensure unique results by ID
      const existingIds = new Set(allResults.map(r => r.id));
      const uniqueAdditionalResults = additionalResults.filter(r => !existingIds.has(r.id));
      allResults = [...allResults, ...uniqueAdditionalResults];
    }

    return await Promise.all(
      allResults.map(async (result: any) => await enrichMovieWithPoster({
        id: result.id.toString(),
        title: result.title || result.name,
        year: new Date(result.release_date || result.first_air_date).getFullYear(),
        rating: typeof result.vote_average === 'number' ? result.vote_average : 0,
        duration: contentType === 'movie' ? (result.runtime || 120) : 'TV Series',
        language: (result.original_language || 'en').toUpperCase(),
        genres: mapTMDBGenres(result.genre_ids || []),
        description: result.overview || 'No description available',
        imageUrl: buildImageUrl(result.poster_path),
        backdropUrl: result.backdrop_path ? buildImageUrl(result.backdrop_path, 'original') : undefined,
        streamingPlatforms: [],
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${result.title || result.name} trailer`)}`,
        hasTrailer: false
      }))
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch movies';
    console.error('❌ TMDB API Error:', errorMessage);
    
    // Log additional error details for debugging
    if (error instanceof Error && error.stack) {
      console.debug('Error stack:', error.stack);
    }
    
    // Provide more helpful error messages
    if (errorMessage.includes('No movies found')) {
      throw new Error('No movies found matching your criteria. Try:\n- Selecting different genres or moods\n- Expanding your year range\n- Adjusting your rating requirements');
    }
    
    throw new Error('We encountered an issue while fetching movies. Please try again or adjust your search criteria.');
  }
}

export async function enrichMovieWithPoster(movieOrTitle: Movie | string, year?: number): Promise<Movie> {
  try {
    let movie: Movie;
    if (typeof movieOrTitle === 'string') {
      movie = {
        id: crypto.randomUUID(),
        title: movieOrTitle,
        year: year || new Date().getFullYear(),
        rating: 0,
        duration: 'Movie',
        language: 'EN',
        genres: [],
        description: '',
        imageUrl: API_CONFIG.fallbackImage,
        streamingPlatforms: []
      };
    } else {
      movie = movieOrTitle;
    }

    console.log('🎥 Enriching movie details:', {
      title: movie.title,
      id: movie.id,
      year: movie.year,
      hasImage: !!movie.imageUrl
    });

    // Search for movie by title and year
    const searchUrl = `/search/${movie.duration === 'TV Series' ? 'tv' : 'movie'}?query=${encodeURIComponent(movie.title)}&year=${movie.year}`;
    const searchResults = await tmdbRequest<{ results: any[] }>(searchUrl);

    if (!searchResults?.results?.length) {
      console.warn(`❌ No TMDB results found for ${movie.title} (${movie.year})`);
      return {
        ...movie,
        imageUrl: API_CONFIG.fallbackImage,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`,
        streamingPlatforms: []
      };
    }

    // Get first result details
    const firstResult = searchResults.results[0];
    const details = await tmdbRequest(
      `/${movie.duration === 'TV Series' ? 'tv' : 'movie'}/${firstResult.id}?append_to_response=videos,watch/providers`
    );
    
    if (!details) {
      console.warn(`❌ Failed to get details for ${movie.title}`);
      return {
        ...movie,
        imageUrl: API_CONFIG.fallbackImage,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} trailer`)}`,
        streamingPlatforms: [],
        enrichmentFailed: true
      };
    }
    
    console.log('📥 TMDB details received:', {
      title: details.title || details.name,
      hasPoster: !!details.poster_path,
      hasBackdrop: !!details.backdrop_path,
      hasVideos: details.videos?.results?.length > 0,
      hasProviders: !!details['watch/providers']?.results
    });

    // Explicitly build image URLs using TMDB paths
    const imageUrl = buildImageUrl(details.poster_path);
    const backdropUrl = details.backdrop_path ? buildImageUrl(details.backdrop_path, 'original') : undefined;

    console.log('🖼️ Generated image URLs:', { 
      imageUrl, 
      backdropUrl,
      usingFallback: !details.poster_path,
      originalPosterPath: details.poster_path
    });

    console.log('📺 Processing streaming providers:', {
      hasUSProviders: !!details['watch/providers']?.results?.US,
      totalRegions: Object.keys(details['watch/providers']?.results || {}).length
    });

    let streamingPlatforms: string[] = [];

    if (details['watch/providers']?.results) {
        // Get US providers first, fallback to any region if US not available
        const usProviders = details['watch/providers'].results.US;
        const anyRegionProviders = Object.values(details['watch/providers'].results)[0];
        const providers = usProviders || anyRegionProviders;
        
        if (providers) {
          // Get all available providers
          if (providers.flatrate) {
            streamingPlatforms.push(...providers.flatrate.map((p: any) => p.provider_name));
          }
          if (providers.free) {
            streamingPlatforms.push(...providers.free.map((p: any) => p.provider_name));
          }
          if (providers.ads) {
            streamingPlatforms.push(...providers.ads.map((p: any) => p.provider_name));
          }
          if (providers.buy) {
            streamingPlatforms.push(...providers.buy.map((p: any) => p.provider_name));
          }
          if (providers.rent) {
            streamingPlatforms.push(...providers.rent.map((p: any) => p.provider_name));
          }
        }
    }

    streamingPlatforms = [...new Set(streamingPlatforms)];
    console.log('✅ Final streaming platforms:', {
      count: streamingPlatforms.length,
      platforms: streamingPlatforms,
      movie: movie.title
    });

    return {
      ...movie,
      imageUrl,
      backdropUrl,
      youtubeUrl: getTrailerUrl(details),
      streamingPlatforms
    };
  } catch (error) {
    console.error('❌ Failed to enrich movie:', {
      title: movie.title,
      type: movie.duration === 'TV Series' ? 'TV series' : 'movie',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      ...movie,
      imageUrl: movie.imageUrl || API_CONFIG.fallbackImage,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} trailer`)}`,
      streamingPlatforms: []
    };
  }
}