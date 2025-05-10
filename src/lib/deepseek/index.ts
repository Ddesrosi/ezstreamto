import type { Movie } from '@/types';
import { buildSearchPrompt } from './promptBuilder';
import { enrichMovieWithPoster, FALLBACK_IMAGE } from '../tmdb';
import { BASIC_USER_LIMIT, PREMIUM_USER_LIMIT } from '@/config';
import { fetchMovieListFromDeepseek } from './deepseek-client';
import { generatePerfectMatchInsights } from '@/lib/perfect-match';
import { getDeepseekApiKey } from '../../config';

console.log("🔐 Deepseek API Key used:", getDeepseekApiKey());

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

    const response = await fetchMovieListFromDeepseek(prompt);

    console.log("🪵 Deepseek full response:", response);
    console.log("🪵 rawText:", response?.rawText);

    if (!response || !response.rawMovies) {
      console.error('❌ Invalid response structure:', response);
      throw new RecommendationError('Invalid response from Deepseek: Missing movie data');
    }

    let movieArray: Movie[];
    try {
      movieArray = response.rawMovies;

      if (!Array.isArray(movieArray)) {
        throw new Error("Expected an array of movies");
      }
    } catch (err) {
      console.error("❌ Failed to extract movies from Deepseek format:", err);
      throw new RecommendationError("Invalid Deepseek response structure");
    }

    console.log("📦 Response received from Deepseek:", {
      movieCount: response.rawMovies.length,
      remaining: response.remaining,
      isPremium: response.isPremium
    });

    const enrichedResults = await Promise.all(
      movieArray.map(async (movie) => {
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
    
    let perfectMatch = undefined;

    const limit = preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT;
    const finalResults = enrichedResults.slice(0, limit);
 
    if (preferences.isPerfectMatch && preferences.isPremium) {
      console.log("🎯 Perfect Match enabled: selecting most popular movies from results");

      const sorted = [...finalResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      perfectMatch = {
        main: sorted[0],
        suggestions: sorted.slice(1, 4)
      };

      console.log("🎬 Bloc Perfect Match avec explication est ENTRÉ");

      let explanation: string | undefined;

      try {

        console.log("🧪 Bloc d’explication exécuté");
        
        const explanationPrompt = `
You are an expert film critic AI. Explain in one sentence why the movie "${perfectMatch.main.title}" is a perfect match for a viewer who likes ${preferences.selectedGenres.join(", ")} and feels ${preferences.selectedMoods.join(", ")}.
`.trim();

        console.log("🧠 ENVOI FETCH EXPLANATION vers /deepseek-proxy", {
  explanationPrompt,
  uuid: "perfect-match-server"
});

        const proxyResponse = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ explanationPrompt, uuid: "perfect-match-server" })
        });

        if (!proxyResponse.ok) {
          const errorText = await proxyResponse.text();

          console.warn("⚠️ Deepseek proxy response not OK", {
  status: proxyResponse.status,
  body: errorText
});

          throw new Error(`Deepseek proxy failed: ${errorText}`);
        }

        const proxyData = await proxyResponse.json();

        console.log("📦 Contenu reçu du proxy Deepseek :", proxyData);
        
        explanation = proxyData?.choices?.[0]?.message?.content?.trim();

if (explanation) {
  if (!perfectMatch.main.description || perfectMatch.main.description.trim() === "") {
    perfectMatch.main.description = explanation;
  }
  console.log("🧠 Explanation added to Perfect Match:", explanation);
} else {
  console.warn("⚠️ No explanation returned by Deepseek.");
}

      } catch (error) {
        console.warn("⚠️ Failed to fetch explanation from Deepseek:", error);
        explanation = "We couldn't generate a detailed explanation, but this movie still aligns with your preferences.";
      }

      perfectMatch.insights = {
        explanation: explanation || "This film matches your preferences based on its genre, mood, and audience appeal.",
        recommendations: perfectMatch.suggestions
      };

      console.log("✅ Perfect Match constructed:", {
        mainTitle: perfectMatch.main?.title,
        suggestions: perfectMatch.suggestions?.map(m => m.title)
      });
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