import { API_CONFIG } from '@/config';
import { Movie } from '@/types';
import { mapTMDBGenres, genreMap } from './constants/genres';
import { APPROVED_PLATFORMS } from './constants/platforms';
import type { SearchPreferences } from './deepseek/types';
import pLimit from 'p-limit';

// Constants
const TMDB_API_URL = API_CONFIG.tmdb.baseUrl;
const TMDB_IMAGE_URL = `${API_CONFIG.tmdb.imageBaseUrl}/w500`;
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
export const FALLBACK_TRAILER = 'https://www.youtube.com/results?search_query=official+movie+trailer';

console.log('🔑 TMDB API Key:', API_CONFIG.tmdb.apiKey);

const limit = pLimit(5);

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    const separator = url.includes('?') ? '&' : '?';
    const urlWithKey = `${url}${separator}api_key=${API_CONFIG.tmdb.apiKey}`;
    console.log('🌍 Fetching URL:', urlWithKey);

    const response = await limit(async () => {
        return await fetch(urlWithKey, options);
    });

    if (!response.ok) {
        console.error('❌ TMDB API Error:', response.status, response.statusText);
        throw new Error(`HTTP error ${response.status}`);
    }
    return response;
}

export async function fetchMoviesFromTMDB(preferences: SearchPreferences): Promise<Movie[]> {
    try {
        console.log('🔍 Fetching movies from TMDB with preferences:', preferences);

        const contentType = preferences.contentType === 'tv' ? 'tv' : 'movie';
        const genreIds = preferences.selectedGenres
            .map(genre => genreMap[genre] || null)
            .filter(Boolean)
            .join(',');

        const params = new URLSearchParams({
            include_adult: 'false',
            include_video: 'true',
            language: 'en-US',
            page: '1',
            region: 'US',
            sort_by: 'popularity.desc',
            'vote_average.gte': preferences.ratingRange?.min?.toString() || '0',
            'vote_average.lte': preferences.ratingRange?.max?.toString() || '10',
            'primary_release_date.gte': preferences.yearRange?.from ? `${preferences.yearRange.from}-01-01` : '1920-01-01',
            'primary_release_date.lte': preferences.yearRange?.to ? `${preferences.yearRange.to}-12-31` : '2025-12-31'
        });

        if (genreIds) {
            params.append('with_genres', genreIds);
        }

        console.log('🛠️ TMDB Query Parameters:', Object.fromEntries(params.entries()));

        const response = await fetchWithRetry(
            `${TMDB_API_URL}/discover/${contentType}?${params.toString()}`
        );

        const data = await response.json();
        console.log('📊 TMDB API Response:', data);

        if (!data.results || data.results.length === 0) {
            console.warn('⚠️ No movies found. Consider relaxing filters.');
            return [];
        }

        const movies: Movie[] = await Promise.all(
            data.results.map(async (result: any) => {
                const movie: Movie = {
                    id: result.id.toString(),
                    title: result.title || result.name,
                    year: new Date(result.release_date || result.first_air_date).getFullYear(),
                    rating: result.vote_average || 0,
                    duration: contentType === 'movie' ? 'Movie' : 'TV Series',
                    language: (result.original_language || 'en').toUpperCase(),
                    genres: mapTMDBGenres(result.genre_ids || []),
                    description: result.overview || 'No description available',
                    imageUrl: result.poster_path 
                        ? `${TMDB_IMAGE_URL}${result.poster_path}`
                        : FALLBACK_IMAGE,
                    backdropUrl: result.backdrop_path
                        ? `${TMDB_IMAGE_URL}${result.backdrop_path}`
                        : undefined,
                    streamingPlatforms: [],
                    youtubeUrl: FALLBACK_TRAILER,
                    hasTrailer: false
                };
                return await enrichMovieWithPoster(movie);
            })
        );

        console.log('✅ Processed Movies:', movies);
        return movies;
    } catch (error) {
        console.error('❌ TMDB API Error:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch movies');
    }
}

export async function enrichMovieWithPoster(movie: Movie): Promise<Movie> {
    try {
        console.log('🎬 Enriching movie:', movie.title);
        
        const detailsUrl = `${TMDB_API_URL}/movie/${movie.id}?append_to_response=videos,watch/providers`;
        const detailsResponse = await fetchWithRetry(detailsUrl);
        const details = await detailsResponse.json();
        console.log('📺 Full API Response:', details);

        // Get trailer URL
        const trailer = details.videos?.results?.find(
            video => video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
        );

        const youtubeUrl = trailer
            ? `https://www.youtube.com/watch?v=${trailer.key}`
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`;

        const providersUS = details['watch/providers']?.results?.US || {};
        const providersCA = details['watch/providers']?.results?.CA || {};
        
        let streamingPlatforms = [
            ...(providersUS.flatrate ?? []),
            ...(providersUS.buy ?? []),
            ...(providersUS.rent ?? []),
            ...(providersCA.flatrate ?? []),
            ...(providersCA.buy ?? []),
            ...(providersCA.rent ?? [])
        ].map(provider => provider.provider_name);

        const approvedPlatformNames = Object.keys(APPROVED_PLATFORMS);
        const filteredPlatforms = [...new Set(streamingPlatforms)]
            .filter(provider => approvedPlatformNames.includes(provider));

        console.log('✅ Approved Platforms:', filteredPlatforms);
        
        return {
            ...movie,
            streamingPlatforms: filteredPlatforms.length > 0 ? filteredPlatforms : ['Not available'],
            youtubeUrl,
            hasTrailer: !!trailer
        };
    } catch (error) {
        console.error('❌ Error enriching movie:', error);
        return movie;
    }
}