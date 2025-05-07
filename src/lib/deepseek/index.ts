import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster, FALLBACK_IMAGE } from '../tmdb';
import { findPerfectMatch } from '../perfect-match';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT } from '@/config';
import { fetchMovieListFromDeepseek } from './deepseek-client';
import { generatePerfectMatchInsights } from '@/lib/perfect-match';

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
  perfectMatch?: any;
  remaining?: number;
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
      genres: preferences.selectedGenres.length,
      isPerfectMatch: preferences.isPerfectMatch
    });

    const prompt = buildSearchPrompt(preferences);
    console.log('📝 Prompt sent to Deepseek:\n' + prompt);
    console.log('🔑 Keywords:', preferences.keywords);

    // 🔄 Fetch raw movies from Deepseek AI

    console.log("📨 Prompt sent to Deepseek:", prompt);

perfectMatch = undefined;

if (preferences.isPerfectMatch && preferences.isPremium) {
  console.log("🎯 Perfect Match enabled: selecting most popular movies from results");
  // Le tri par popularité sera fait plus tard une fois les résultats enrichis
}

    const response = await fetchMovieListFromDeepseek(prompt);

    console.log("🪵 Deepseek full response:", response);
console.log("🪵 rawText:", response?.rawText);

    if (!response || !response.rawMovies) {
      console.error('❌ Invalid response structure:', response);
      throw new RecommendationError('Invalid response from Deepseek: Missing movie data');
    }

    if (!Array.isArray(response.rawMovies)) {
      console.error('❌ Invalid movies data type:', typeof response.rawMovies);
      throw new RecommendationError('Invalid response from Deepseek: Movie data is not an array');
    }

    console.log("📦 Response received from Deepseek:", {
      movieCount: response.rawMovies.length,
      remaining: response.remaining,
      isPremium: response.isPremium
    });

    // 🔍 Enrich results with posters, streaming, trailers, etc.
    const enrichedResults = await Promise.all(
      response.rawMovies.map(async (movie) => {
        const movieWithDefaults = {
          id: crypto.randomUUID(),
          title: movie.title,
          year: movie.year || new Date().getFullYear(),
          rating: movie.rating || 0,
          duration: movie.duration || 'Movie',
          language: movie.language || 'EN',
          genres: movie.genres || [],
          description: movie.description || '',
          imageUrl: movie.imageUrl || FALLBACK_IMAGE,
          streamingPlatforms: []
        };

        return enrichMovieWithPoster(movieWithDefaults);
      })
    );

   
    const limit = preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT;
    const finalResults = enrichedResults.slice(0, limit);

        let perfectMatch = undefined;

    if (preferences.isPerfectMatch && preferences.isPremium) {
  console.log("🔍 Sorting for Perfect Match based on popularity");

  const sorted = [...finalResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  perfectMatch = {
    main: sorted[0],
    suggestions: sorted.slice(1, 4)
  };

    try {
  const explanationPrompt = `
  Based on the user's selected preferences, explain in 3–4 sentences why this specific movie is a perfect match for them.
  
  User Preferences:
  - Type: ${preferences.contentType}
  - Genres: ${preferences.selectedGenres.join(", ")}
  - Moods: ${preferences.selectedMoods.join(", ")}
  - Year range: ${preferences.yearRange.from}–${preferences.yearRange.to}
  - Rating range: ${preferences.ratingRange.min}–${preferences.ratingRange.max}
  
  Movie:
  - Title: ${perfectMatch.main.title}
  - Genres: ${perfectMatch.main.genres.join(", ")}
  - Year: ${perfectMatch.main.year}
  - Description: ${perfectMatch.main.description}
  
  Return only the explanation as plain text.
  `;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getDeepseekApiKey()}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: explanationPrompt }],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  const data = await response.json();
  const explanation = data?.choices?.[0]?.message?.content?.trim();

  if (explanation) {
    perfectMatch.main.description = explanation;
    console.log("🧠 Explanation added to Perfect Match:", explanation);
  } else {
    console.warn("⚠️ No explanation returned from Deepseek.");
  }
} catch (error) {
  console.warn("⚠️ Failed to fetch explanation from Deepseek:", error);
}
  
  console.log("✅ Perfect Match constructed:", {
    mainTitle: perfectMatch.main?.title,
    suggestions: perfectMatch.suggestions?.map(m => m.title)
  });
}

if (preferences.isPerfectMatch && preferences.isPremium) {
  const sorted = [...finalResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  perfectMatch = {
    main: sorted[0],
    suggestions: sorted.slice(1, 4)
  };
}

 if (perfectMatch?.main && preferences.isPerfectMatch && preferences.isPremium) {
  try {
    const insights = await generatePerfectMatchInsights(perfectMatch.main, preferences);
    perfectMatch.insights = insights;
  } catch (err) {
    console.warn('⚠️ Failed to generate insights:', err);
    perfectMatch.insights = undefined;
  }
}
   
    console.log('✅ Final results ready:', {
      count: finalResults.length,
      limit,
      isPremium: preferences.isPremium
    });

    return {
  results: finalResults,
  perfectMatch,
  remaining: response.remaining
  };
    
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
