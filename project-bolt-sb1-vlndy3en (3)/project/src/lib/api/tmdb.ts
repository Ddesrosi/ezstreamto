import { API_CONFIG } from '@/config';
import { TMDBError } from './errors';
import { RateLimiter } from '../utils/rate-limiter';
import { retryWithBackoff } from '../utils/retry';

const rateLimiter = new RateLimiter(
  API_CONFIG.tmdb.rateLimit,
  API_CONFIG.tmdb.rateWindow
);

interface TMDBRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function tmdbRequest<T>(
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
    throw new TMDBError('TMDB API key is not configured');
  }

  // Add API key to URL
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
        const errorData = await response.json().catch(() => null);
        throw new TMDBError(
          errorData?.status_message || `HTTP error ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TMDBError('Request timed out');
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
  export async function enrichMovieWithPoster(movie) {
  try {
    if (!movie || !movie.id) {
      console.warn("⚠️ Movie ID is missing. Skipping poster enrichment.");
      movie.imageUrl = 'https://via.placeholder.com/500x750?text=No+Image';
      return movie;
    }

    const data = await tmdbRequest(`/movie/${movie.id}`);

    if (!data || !data.poster_path) {
      console.warn(`⚠️ No poster found for movie "${movie.title}"`);
      movie.imageUrl = 'https://via.placeholder.com/500x750?text=No+Image';
    } else {
      movie.imageUrl = `${API_CONFIG.tmdb.imageBaseUrl}${data.poster_path}`;
    }

    return movie;
  } catch (error) {
    console.error(`❌ Error enriching movie "${movie?.title || 'Unknown'}":`, error);
    movie.imageUrl = 'https://via.placeholder.com/500x750?text=Error';
    return movie;
  }
}

}