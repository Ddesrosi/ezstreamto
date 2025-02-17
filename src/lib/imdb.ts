import { Movie } from '@/types';
import { enrichMovieWithPoster } from './tmdb';

const IMDB_API_URL = 'https://imdb236.p.rapidapi.com';
const IMDB_API_KEY = '7b293bd4abmshc832574588bc9c9p1c0914jsn7f6878c4fb17';

interface IMDBMovie {
  id: string;
  title: string;
  year: number;
  rating: number;
  plot: string;
  genres: string[];
  directors: string[];
  stars: string[];
  image: {
    url: string;
  };
  trailer?: {
    url: string;
  };
  runtime?: string;
  languages?: string[];
}

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
  minRating?: number;
  language?: string;
}

async function searchMovies(query: string, preferences: SearchPreferences): Promise<IMDBMovie[]> {
  if (!IMDB_API_KEY) {
    throw new Error('IMDB API key is not configured');
  }

  if (!query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  try {
    // Build a more specific search query
    const searchTerms = [query];
    
    if (preferences.contentType) {
      searchTerms.push(preferences.contentType === 'movie' ? 'movie' : 'tv series');
    }
    
    if (preferences.selectedAudience) {
      switch (preferences.selectedAudience) {
        case 'family':
          searchTerms.push('family-friendly');
          break;
        case 'teens':
          searchTerms.push('teen');
          break;
        case 'adults':
          searchTerms.push('mature');
          break;
      }
    }

    const response = await fetch(`${IMDB_API_URL}/title/find?q=${encodeURIComponent(searchTerms.join(' '))}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'imdb236.p.rapidapi.com',
        'x-rapidapi-key': IMDB_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || errorData?.error || `API Error (${response.status}): Failed to search movies`;
      throw new Error(errorMessage);
    }

    const data = await response.json().catch(() => {
      throw new Error('Invalid JSON response from IMDB API');
    });
    
    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from IMDB API');
    }

    // Handle the specific response format
    const results = data.results.filter((item: any) => {
      if (!item || typeof item !== 'object') return false;
      return item.titleType === (preferences.contentType === 'movie' ? 'movie' : 'tvSeries');
    });

    if (results.length === 0) {
      throw new Error('No results found matching your criteria. Try broadening your search.');
    }

    return results.map((item: any) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || 'Unknown Title',
      year: item.year || new Date().getFullYear(),
      rating: item.rating?.average || 0,
      plot: item.plot || 'No plot available',
      genres: Array.isArray(item.genres) ? item.genres : [],
      directors: [],
      stars: [],
      image: {
        url: item.image?.url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba'
      }
    }));
  } catch (error) {
    console.error('IMDB Search Error:', error);
    if (error instanceof Error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    throw new Error('Failed to search movies. Please try different search terms.');
  }
}

async function getMovieDetails(movieId: string): Promise<IMDBMovie> {
  if (!IMDB_API_KEY) {
    throw new Error('IMDB API key is not configured');
  }

  if (!movieId) {
    throw new Error('Movie ID is required');
  }

  try {
    const response = await fetch(`${IMDB_API_URL}/title/details/${movieId}`, {
      headers: {
        'x-rapidapi-host': 'imdb236.p.rapidapi.com',
        'x-rapidapi-key': IMDB_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || errorData?.error || `API Error (${response.status}): Failed to fetch movie details`;
      throw new Error(errorMessage);
    }

    const data = await response.json().catch(() => {
      throw new Error('Invalid JSON response from IMDB API');
    });

    if (!data || !data.id || !data.title) {
      throw new Error('Invalid movie details received from API');
    }

    return {
      id: data.id,
      title: data.title,
      year: data.year || new Date().getFullYear(),
      rating: data.rating?.average || 0,
      plot: data.plot || 'No plot description available.',
      genres: Array.isArray(data.genres) ? data.genres : [],
      directors: data.directors?.map((d: any) => d.name).filter(Boolean) || [],
      stars: data.cast?.slice(0, 3).map((actor: any) => actor.name).filter(Boolean) || [],
      image: {
        url: data.image?.url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba'
      },
      trailer: data.trailer,
      runtime: data.runtime || 'Duration not available',
      languages: Array.isArray(data.languages) ? data.languages : ['English']
    };
  } catch (error) {
    console.error('IMDB Details Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch details: ${error.message}`);
    }
    throw new Error('Failed to fetch movie details. Please try again.');
  }
}

function getMoodSearchTerms(moods: string[]): string[] {
  const moodMap: Record<string, string[]> = {
    happy: ['comedy', 'feel-good', 'uplifting'],
    relaxed: ['drama', 'slow-paced', 'slice-of-life'],
    excited: ['action', 'thriller', 'adventure'],
    romantic: ['romance', 'love story'],
    thoughtful: ['drama', 'psychological', 'thought-provoking'],
    adventurous: ['adventure', 'action', 'exploration'],
    nostalgic: ['classic', 'retro', 'period'],
    mysterious: ['mystery', 'thriller', 'suspense']
  };

  return moods.flatMap(mood => moodMap[mood.toLowerCase()] || [mood]);
}

export async function getMovieRecommendations(preferences: SearchPreferences): Promise<Movie[]> {
  try {
    // Validate preferences
    if (!preferences.contentType) {
      throw new Error('Please select a content type (Movie or TV Series)');
    }

    if (!preferences.selectedMoods.length && !preferences.selectedGenres.length && !preferences.keywords.length) {
      throw new Error('Please select at least one mood, genre, or keyword');
    }

    // Build search query based on preferences
    const searchTerms: string[] = [
      ...preferences.selectedGenres,
      ...preferences.keywords,
      ...getMoodSearchTerms(preferences.selectedMoods)
    ].filter(Boolean);

    if (searchTerms.length === 0) {
      throw new Error('Invalid search criteria. Please adjust your preferences.');
    }

    // Search for movies
    const searchResults = await searchMovies(searchTerms.join(' '), preferences);

    // Filter results
    let filteredResults = searchResults.filter(movie => {
      const yearMatch = movie.year >= preferences.yearRange.from && 
                       movie.year <= preferences.yearRange.to;
      const ratingMatch = !preferences.minRating || movie.rating >= preferences.minRating;
      return yearMatch && ratingMatch;
    });

    if (filteredResults.length === 0) {
      throw new Error('No movies found matching your criteria. Try adjusting your filters.');
    }

    // Sort by rating and relevance
    filteredResults.sort((a, b) => b.rating - a.rating);

    // Get detailed information for top 5 movies
    const detailedMovies = await Promise.all(
      filteredResults
        .slice(0, 5)
        .map(async movie => {
          try {
            return await getMovieDetails(movie.id);
          } catch (error) {
            console.error(`Failed to fetch details for movie ${movie.id}:`, error);
            return movie;
          }
        })
    );

    // Map to our Movie type and enrich with real posters
    const movies = detailedMovies.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      rating: movie.rating,
      duration: movie.runtime || 'Feature Film',
      language: movie.languages?.[0] || 'English',
      genres: movie.genres,
      description: movie.plot,
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba', // Temporary
      streamingPlatforms: preferences.selectedServices,
      director: movie.directors,
      stars: movie.stars,
      trailer: movie.trailer?.url
    }));

    // Enrich all movies with real posters in parallel
    const enrichedMovies = await Promise.all(
      movies.map(movie => enrichMovieWithPoster(movie))
    );

    return enrichedMovies;
  } catch (error) {
    console.error('Movie Recommendations Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}