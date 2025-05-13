import { buildSearchPrompt } from "./buildPrompt";
import { generateTextOnly } from "./deepseek-client";
import { enrichMovieWithPoster } from "../tmdb";
import { selectPerfectMatchFromResults } from "@/lib/perfect-match/selectPerfectMatchFromResults";
import { generatePerfectMatchExplanationPrompt } from "@/lib/perfect-match/explanation-prompt";

import type { Movie, SearchPreferences } from "@/types";

const BASIC_USER_LIMIT = 5;
const PREMIUM_USER_LIMIT = 10;

export async function getMovieRecommendations(preferences: SearchPreferences) {
  const prompt = buildSearchPrompt(preferences);

  console.log("📨 Prompt sent to Deepseek:", prompt);

  const response = await fetch("/api/deepseek-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      uuid: "standard-search"
    })
  });

  const rawText = await response.text();

  console.log("📄 Deepseek raw content BEFORE parsing:\n", rawText);

  if (!response.ok) {
    throw new Error(`Deepseek error: ${rawText}`);
  }

  // 🔧 Clean Markdown formatting
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```(?:json)?/g, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Failed to parse Deepseek JSON:", err);
    throw new Error("Invalid JSON response from Deepseek");
  }

  if (!Array.isArray(parsed.recommendations)) {
    throw new Error("Deepseek response missing recommendations array");
  }

  // Enrich each movie with TMDB data
  const enriched = await Promise.all(
    parsed.recommendations.map((m: Movie) => enrichMovieWithPoster(m))
  );

  // 🔮 Generate Perfect Match if requested
  let perfectMatch;
  if (preferences.isPerfectMatch && preferences.isPremium) {
    try {
      const { main, similar } = selectPerfectMatchFromResults(enriched);

      const explanationPrompt = generatePerfectMatchExplanationPrompt(preferences, main);
      const explanation = await generateTextOnly(explanationPrompt);

      perfectMatch = {
        movie: main,
        insights: {
          reason: explanation,
          similar
        }
      };
      console.log("✨ Perfect Match generated:", perfectMatch);
    } catch (err) {
      console.error("❌ Perfect Match generation failed:", err);
      perfectMatch = undefined;
    }
  }

  return {
    results: enriched,
    perfectMatch,
    remaining: preferences.isPremium ? PREMIUM_USER_LIMIT : BASIC_USER_LIMIT
  };
}
