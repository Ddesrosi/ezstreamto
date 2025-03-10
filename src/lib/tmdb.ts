import { API_CONFIG } from '@/config';
import { Movie } from '@/types';
import { mapTMDBGenres, genreMap } from './constants/genres';
import { APPROVED_PLATFORMS } from './constants/platforms';
import type { SearchPreferences } from './deepseek/types';
import { RateLimiter } from './utils/rate-limiter';
import { retryWithBackoff } from './utils/retry';

const TMDB_IMAGE_URL = `${API_CONFIG.tmdb.imageBaseUrl}/w500`;
const TMDB_DISCOVER_URL = `${API_CONFIG.tmdb.baseUrl}/discover`;
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
export const FALLBACK_TRAILER = 'https://www.youtube.com/results?search_query=official+movie+trailer';

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
): Promise<T> {
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
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
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
        imageUrl: result.poster_path ? `${TMDB_IMAGE_URL}${result.poster_path}` : FALLBACK_IMAGE,
        backdropUrl: result.backdrop_path ? `${TMDB_IMAGE_URL}${result.backdrop_path}` : undefined,
        streamingPlatforms: [],
        youtubeUrl: FALLBACK_TRAILER,
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

export async function enrichMovieWithPoster(movie: Movie): Promise<Movie> {
  try {
    console.log('🎬 Enriching movie:', movie.title);
    
    // Determine content type based on duration
    const contentType = movie.duration === 'TV Series' ? 'tv' : 'movie';
    const details = await tmdbRequest(`/${contentType}/${movie.id}?append_to_response=videos,watch/providers`);
    
    // Get runtime from details
    const runtime = contentType === 'movie' 
      ? details.runtime 
      : details.episode_run_time?.[0] || movie.duration;
      
    const duration = typeof runtime === 'number' ? runtime : 
      typeof movie.duration === 'number' ? movie.duration : 
      movie.duration === 'TV Series' ? 'TV Series' : 120;

    const trailer = details.videos?.results?.find(
      video => video?.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser' || video.type === 'Opening Credits')
    );
    
    const youtubeUrl = trailer?.key 
      ? `https://www.youtube.com/watch?v=${trailer.key}` 
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`;

    console.log('⚠️ [DEBUG] Raw Watch Providers Data:', details['watch/providers']);

    let streamingPlatforms: string[] = [];

    if (details['watch/providers']?.results) {
        Object.values(details['watch/providers'].results).forEach((providerData: any) => {
            if (providerData.flatrate) {
                streamingPlatforms.push(...providerData.flatrate.map((provider: any) => provider.provider_name));
            }
            if (providerData.buy) {
                streamingPlatforms.push(...providerData.buy.map((provider: any) => provider.provider_name));
            }
            if (providerData.rent) {
                streamingPlatforms.push(...providerData.rent.map((provider: any) => provider.provider_name));
            }
        });
    }

    streamingPlatforms = [...new Set(streamingPlatforms)];
    console.log('✅ [DEBUG] Streaming Platforms Before Filtering:', streamingPlatforms);

    // ✅ Define `filteredPlatforms` before using it
    const approvedPlatformNames = Object.keys(APPROVED_PLATFORMS);
    const approvedMatches = Object.values(APPROVED_PLATFORMS).flatMap(platform => platform.matches);

    const filteredPlatforms = streamingPlatforms.filter(provider =>
        approvedPlatformNames.includes(provider) || approvedMatches.includes(provider)
    );

    console.log('✅ [DEBUG] Streaming Platforms Final before returning:', filteredPlatforms);

    return {
      ...movie,
      duration,
      streamingPlatforms: filteredPlatforms.length > 0 ? filteredPlatforms : [],
      youtubeUrl,
      hasTrailer: !!trailer
    };
  } catch (error) {
    console.warn(`⚠️ Could not enrich ${movie.duration === 'TV Series' ? 'TV series' : 'movie'} details:`, movie.title, error);
    return movie;
  }
}