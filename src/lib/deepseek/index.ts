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
  console.log("🔥 getMovieRecommendations() called", preferences);
  console.log("🎯 isPerfectMatch:", preferences.isPerfectMatch);
  console.log("💎 isPremium:", preferences.isPremium);

  try {
    validatePreferences(preferences);
    console.log('✅ Preferences validated');

    const prompt = buildSearchPrompt(preferences);
    console.log('📝 Prompt sent to Deepseek:\n' + prompt);

    let response;
    try {
      response = await fetchMovieListFromDeepseek(prompt);
      console.log("🪵 Deepseek response received:", {
        movieCount: response?.rawMovies?.length,
        remaining: response?.remaining
      });

      if (!response?.rawMovies?.length) {
        throw new RecommendationError('No movie recommendations received');
      }
    } catch (error) {
      console.error("❌ Deepseek API error:", error);
      throw new RecommendationError(
        "We're having trouble getting movie recommendations right now. Please try again in a moment."
      );
    }

    const enrichedResults = await Promise.all(
      response.rawMovies.map(async (movie) => {
        try {
          if (!movie?.title) {
            console.warn("⚠️ Skipping movie with missing title:", movie);
            return null;
          }

          const movieWithDefaults = {
            id: crypto.randomUUID(),
            title: movie.title,
            year: movie.year || new Date().getFullYear(),
            rating: movie.rating || 0,
            duration: movie.duration || 'Movie',
            language: movie.language || 'EN',
            genres: Array.isArray(movie.genres) ? movie.genres : [],
            description: movie.description || '',
            imageUrl: movie.imageUrl || FALLBACK_IMAGE,
            streamingPlatforms: []
          };

          return await enrichMovieWithPoster(movieWithDefaults);
        } catch (error) {
          console.error("❌ Failed to enrich movie:", error);
          return null;
        }
      })
    );
    
    const validResults = enrichedResults.filter((movie): movie is Movie => movie !== null);
    
    if (validResults.length === 0) {
      throw new RecommendationError('No valid movie recommendations found');
    }

    const limit = preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT;
    const finalResults = validResults.slice(0, limit);
    
    let perfectMatch;

    if (preferences.isPerfectMatch && preferences.isPremium) {
      console.log("🎯 Generating Perfect Match");

      try {
        const sorted = [...finalResults].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        perfectMatch = {
          main: sorted[0],
          suggestions: sorted.slice(1, 4)
        };

        let explanation: string | undefined;

        try {
          const explanationPrompt = `
            You are an expert film critic AI. Explain in one sentence why the movie "${perfectMatch.main.title}" 
            is a perfect match for a viewer who likes ${preferences.selectedGenres.join(", ")} 
            and feels ${preferences.selectedMoods.join(", ")}.
          `.trim();

          const proxyResponse = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek-proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              prompt: explanationPrompt,
              uuid: "perfect-match-server",
              ip: "server"
            })
          });

          if (!proxyResponse.ok) {
            throw new Error(`Deepseek proxy failed: ${await proxyResponse.text()}`);
          }

          const proxyData = await proxyResponse.json();
          explanation = proxyData?.choices?.[0]?.message?.content?.trim();

        } catch (error) {
          console.warn("⚠️ Failed to fetch explanation:", error);
          explanation = "This film perfectly aligns with your selected preferences and viewing taste.";
        }

        perfectMatch.insights = {
          explanation: explanation,
          recommendations: perfectMatch.suggestions
        };

      } catch (error) {
        console.error("❌ Perfect Match generation failed:", error);
        // Don't throw here, just continue without perfect match
      }
    }

    console.log('✅ Final results ready:', {
      count: finalResults.length,
      limit,
      hasPerfectMatch: !!perfectMatch
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