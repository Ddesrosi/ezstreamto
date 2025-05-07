import { Movie } from '@/types';
import { enrichMovieWithPoster } from './tmdb';
import { DEEPSEEK_API_KEY } from "./config";

// Constants
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MTNjZDMzZjdjNDViNjUwMTQ4NzljYWVhZDcyY2FiYSIsIm5iZiI6MTczODAwNTE3Ni43MjMsInN1YiI6IjY3OTdkYWI4YTZlNDEyODNmMTJiNDU2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dM4keiy2kA6XcUufnGGSnCDCUJGwFMg91pq4I5Bziq8';
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';

interface PerfectMatchPreferences {
  contentType: 'movie' | 'tv' | null;
  genres: string[];
  moods: string[];
  yearRange: {
    from: number;
    to: number;
  };
  ratingRange: {
    min: number;
    max: number;
  };
}

export interface PerfectMatchInsights {
  explanation: string;
  recommendations: {
    title: string;
    reason: string;
    imageUrl?: string;
    year?: number;
    rating?: number;
    language?: string;
    genres?: string[];
    duration?: number | string;
    youtubeUrl?: string;
    streamingPlatforms?: string[];
  }[];
}

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

// Map moods to genre combinations and keywords
const moodMap: Record<string, { genres: number[]; keywords: string[] }> = {
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

function getGenreIds(genres: string[], moods: string[]): number[] {
  const genreIds = new Set<number>();
  
  genres.forEach(genre => {
    const tmdbId = genreMap[genre];
    if (tmdbId) genreIds.add(tmdbId);
  });

  moods.forEach(mood => {
    const moodGenres = moodMap[mood]?.genres || [];
    moodGenres.forEach(id => genreIds.add(id));
  });

  return Array.from(genreIds);
}

function getMoodKeywords(moods: string[]): string[] {
  return moods.flatMap(mood => moodMap[mood]?.keywords || []);
}

function validateRecommendation(rec: any): boolean {
  return (
    typeof rec === 'object' &&
    typeof rec.title === 'string' &&
    typeof rec.reason === 'string' &&
    (!rec.year || typeof rec.year === 'number') &&
    (!rec.rating || typeof rec.rating === 'number') &&
    (!rec.language || typeof rec.language === 'string') &&
    (!rec.genres || Array.isArray(rec.genres))
  );
}

async function generatePerfectMatchInsights(
  movie: Movie,
  preferences: PerfectMatchPreferences
): Promise<PerfectMatchInsights> {
  const apiKey = getDeepseekApiKey();
  console.log('🔑 Deepseek API key inside function:', apiKey ? '✅ Present' : '❌ Missing');

  if (!apiKey) {
    console.error('❌ Deepseek API key is missing');
    throw new Error('Deepseek API key is not configured. Please check your environment variables.');
  }

  try {
    const prompt = `
      Based on a user's preferences and their perfect movie match, generate personalized insights.
      
      User Preferences:
      - Content Type: ${preferences.contentType}
      - Genres: ${preferences.genres.join(', ')}
      - Moods: ${preferences.moods.join(', ')}
      - Year Range: ${preferences.yearRange.from}-${preferences.yearRange.to}
      - Rating Range: ${preferences.ratingRange.min}-${preferences.ratingRange.max}
      
      Perfect Match:
      - Title: ${movie.title}
      - Year: ${movie.year}
      - Genres: ${movie.genres.join(', ')}
      - Description: ${movie.description}
      
      Please provide:
      1. A personalized explanation (3-4 sentences) of why this movie is perfect for them
      2. Three similar movie recommendations with brief reasons
      
      Return as JSON:
      {
        "explanation": "string",
        "recommendations": [
          {
            "title": "string",
            "reason": "string (1-2 sentences)",
            "year": number,
            "rating": number,
            "language": "string",
            "genres": ["string"]
          }
        ]
      }
    `;

    console.log('🧪 Deepseek call debug', {
      apiKey,
      movieTitle: movie.title,
      genres: preferences.genres,
      moods: preferences.moods,
      ratingRange: preferences.ratingRange,
      yearRange: preferences.yearRange,
    });

    console.log("📨 Prompt sent to Deepseek (Perfect Match):", prompt);
    console.log("🔑 Using Deepseek API key:", apiKey);
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response structure');
    }

    let insights;
    try {
      insights = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse insights response:', error);
      throw new Error('Failed to parse insights response');
    }

    if (!insights?.recommendations || !Array.isArray(insights.recommendations)) {
      throw new Error('Invalid recommendations format');
    }

    const validRecommendations = insights.recommendations
      .filter(validateRecommendation)
      .slice(0, 3);

    if (validRecommendations.length === 0) {
      throw new Error('No valid recommendations found');
    }

    const enrichedRecommendations = await Promise.all(
      validRecommendations.map(async (rec) => {
        try {
          const duration = rec.duration || 'Movie';
          const movie: Movie = {
            id: crypto.randomUUID(),
            title: rec.title,
            year: rec.year || new Date().getFullYear(),
            rating: rec.rating || 0,
            duration: preferences.contentType === 'tv' ? 'TV Series' : '120 min',
            language: rec.language || 'EN',
            genres: rec.genres || [],
            description: rec.reason || '',
            imageUrl: '',
            streamingPlatforms: []
          };

          const enriched = await enrichMovieWithPoster(movie);
          return {
            ...rec,
            imageUrl: enriched.imageUrl,
            duration: enriched.duration || (preferences.contentType === 'tv' ? 'TV Series' : '120 min'),
            youtubeUrl: enriched.youtubeUrl,
            streamingPlatforms: enriched.streamingPlatforms
          };
        } catch (error) {
          console.warn(`❌ Enrichment failed for "${rec.title}"`, {
            error,
            original: rec
          });
          return {
            ...rec,
            duration: preferences.contentType === 'tv' ? 'TV Series' : '120 min',
            imageUrl: FALLBACK_IMAGE,
            streamingPlatforms: []
          };
        }
      })
    );

    return {
      explanation: insights.explanation || generateFallbackExplanation(movie, preferences),
      recommendations: enrichedRecommendations
    };
  } catch (error) {
    console.error('Failed to generate insights:', error);
    console.warn('⚠️ Deepseek failed or returned invalid data — fallback insights used');
    return generateFallbackInsights(movie, preferences);
  }
}

function generateFallbackExplanation(movie: Movie, preferences: PerfectMatchPreferences): string {
  const genreMatch = movie.genres.filter(g => preferences.genres.includes(g));
  const moodDesc = preferences.moods.join(' and ').toLowerCase();
  
  return `"${movie.title}" perfectly matches your interest in ${genreMatch.join(' and ')} content and your ${moodDesc} mood. Its ${movie.year} release and ${movie.rating.toFixed(1)} rating align with your preferences, making it an ideal choice for your viewing taste.`;
}

function generateFallbackInsights(movie: Movie, preferences: PerfectMatchPreferences): PerfectMatchInsights {
  const fallbackYear = movie.year || 2000;
  const fallbackRating = movie.rating || 7.0;
  const fallbackLanguage = movie.language || 'EN';
  const fallbackDuration = preferences.contentType === 'tv' ? 'TV Series' : '120 min';

  return {
    explanation: generateFallbackExplanation(movie, preferences),
    recommendations: movie.genres.slice(0, 3).map(genre => ({
      title: `Similar ${genre} Movie`,
      reason: `Features similar ${genre.toLowerCase()} elements to "${movie.title}"`,
      year: fallbackYear,
      rating: fallbackRating,
      language: fallbackLanguage,
      genres: [genre],
      duration: fallbackDuration,
      imageUrl: FALLBACK_IMAGE,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title)}+trailer`,
      streamingPlatforms: []
    }))
  };
}

async function findPerfectMatchMovie(preferences: PerfectMatchPreferences): Promise<Movie> {
  console.log("🎯 Calling Supabase perfect-match function");

  const response = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/perfect-match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(preferences)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Supabase perfect-match failed:", errorText);
    throw new Error("Failed to fetch perfect match movie");
  }

  const data = await response.json();
  return data.movie;
}

export async function findPerfectMatch(preferences: PerfectMatchPreferences): Promise<{
  movie: Movie;
  insights: PerfectMatchInsights;
}> {
  try {
    console.log("🚀 findPerfectMatch() called");
    const movie = await findPerfectMatchMovie(preferences);
    const insights = await generatePerfectMatchInsights(movie, preferences);
    return { movie, insights };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to find perfect match';
    console.error('Perfect match error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export type { PerfectMatchPreferences, PerfectMatchInsights };

export { generatePerfectMatchInsights };

