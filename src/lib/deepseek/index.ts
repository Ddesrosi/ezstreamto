import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster } from '../tmdb';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT, DEEPSEEK_CONFIG, API_CONFIG } from '@/config';

class RecommendationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationError';
  }
}

function validatePreferences(preferences: SearchPreferences): void {
  if (!preferences) throw new RecommendationError('Search preferences are required');
  if (!preferences.contentType) throw new RecommendationError('Please select a content type');
  if (preferences.selectedMoods.length === 0 && preferences.selectedGenres.length === 0)
    throw new RecommendationError('At least one mood or genre must be selected');
  if (preferences.yearRange.from > preferences.yearRange.to)
    throw new RecommendationError('Invalid year range');
  if (preferences.ratingRange.min > preferences.ratingRange.max)
    throw new RecommendationError('Invalid rating range');
}

export async function getMovieRecommendations(preferences: SearchPreferences): Promise<{
  results: Movie[];
}> {
  console.log('🎬 Starting movie recommendations:', {
    contentType: preferences.contentType,
    moods: preferences.selectedMoods,
    genres: preferences.selectedGenres,
    isPremium: preferences.isPremium,
    isPerfectMatch: preferences.isPerfectMatch
  });

  try {
    validatePreferences(preferences);
    console.log('✅ Preferences validated:', {
      contentType: preferences.contentType,
      moods: preferences.selectedMoods.length,
      genres: preferences.selectedGenres.length
    });

    const prompt = buildSearchPrompt(preferences);
    console.log('📝 Built search prompt:', {
      length: prompt.length,
      firstLine: prompt.split('\n')[0]
    });

    console.log('📡 Sending request to Deepseek API...');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        temperature: DEEPSEEK_CONFIG.temperature,
        max_tokens: DEEPSEEK_CONFIG.maxTokens,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      console.error('❌ Deepseek API error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new RecommendationError(`Deepseek API Error (${response.status})`);
    }

    console.log('✅ Received response from Deepseek');
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ Empty response from Deepseek');
      throw new RecommendationError('No response from Deepseek.');
    }

    console.log('📨 Raw Deepseek response:', content);

    let movies: Movie[] = [];

    // ✅ Extract valid JSON array using RegExp
    const match = content.match(/\[.*\]/s); // match the first JSON array
    if (!match) {
      console.warn('❌ Could not extract JSON array from Deepseek content:', content);
      throw new RecommendationError('Deepseek returned unparseable data.');
    }

    try {
      movies = JSON.parse(match[0]);
    } catch (error) {
      console.warn('❌ Failed to parse extracted JSON array:', {
        error,
        content: match[0]
      });
      throw new RecommendationError('Deepseek returned invalid JSON.');
    }

    if (!Array.isArray(movies) || movies.length === 0) {
      console.error('❌ Invalid or empty movies array:', movies);
      throw new RecommendationError('No valid recommendations found.');
    }

    const validMovies = movies.map(movie => {
      const id = crypto.randomUUID();
      if (!movie.title || typeof movie.title !== 'string' ||
          !movie.year || typeof movie.year !== 'number' ||
          typeof movie.rating !== 'number' ||
          !movie.description || typeof movie.description !== 'string') {
        console.warn('❌ Invalid movie object:', movie);
        throw new RecommendationError('Invalid movie data received.');
      }
      return { ...movie, id };
    });

    console.log('🔍 Enriching movies with additional data...');

    const enrichedResults = await Promise.all(
      validMovies
        .slice(0, preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT)
        .map(movie => enrichMovieWithPoster(movie))
    );

    console.log('✨ Final enriched results:', {
      count: enrichedResults.length,
      withPosters: enrichedResults.filter(m => m.imageUrl !== API_CONFIG.fallbackImage).length,
      withTrailers: enrichedResults.filter(m => m.youtubeUrl).length,
      withPlatforms: enrichedResults.filter(m => m.streamingPlatforms?.length > 0).length
    });

    return { results: enrichedResults };
  } catch (error) {
    console.error('❌ Movie recommendation error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    if (error instanceof RecommendationError) throw error;
    throw new RecommendationError('Unable to get recommendations. Please try again later.');
  }
}

export interface SearchPreferences {
  contentType: string | null;
  selectedMoods: string[];
  selectedGenres: string[];
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
