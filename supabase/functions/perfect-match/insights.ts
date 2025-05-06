import { getDeepseekApiKey } from "../_shared/config.ts";
import { enrichMovieWithPoster } from "../_shared/tmdb.ts";
import type { Movie, SearchPreferences } from "../_shared/types.ts";

export async function generatePerfectMatchInsights(preferences: SearchPreferences) {
  const apiKey = getDeepseekApiKey();

  const required = {
    moods: preferences.selectedMoods.join(", "),
    genres: preferences.selectedGenres.join(", "),
    type: preferences.contentType
  };

  const optional = [
    preferences.keywords?.length ? `Keywords: ${preferences.keywords.join(", ")}` : null,
    preferences.yearRange ? `Release between ${preferences.yearRange}` : null,
    preferences.ratingRange ? `Minimum rating: ${preferences.ratingRange}` : null,
    preferences.specificYear ? `Released in the year ${preferences.specificYear}` : null
  ].filter(Boolean).join("\n- ");

  const prompt = `
You are an expert AI assistant specialized in recommending movies.

🎯 TASK:
Based on the user's preferences below, recommend 1 perfect movie, and then suggest 3 similar alternatives.
Do not include documentaries unless explicitly requested.
Only include content available at least in English.
Respond only with a raw JSON object, as described below.

🎬 USER PREFERENCES:
- Mood(s): ${required.moods}
- Genre(s): ${required.genres}
- Type: ${required.type}
${optional ? `- ${optional}` : ""}

🎁 RESPONSE FORMAT (JSON only):

{
  "perfectMatch": {
    "title": "...",
    "year": ...,
    "rating": ...,
    "duration": ...,
    "language": "...",
    "genres": [...],
    "description": "..."
  },
  "explanation": "Why this movie is the perfect match...",
  "youMightAlsoLike": [
    {
      "title": "...",
      "year": ...,
      "rating": ...,
      "duration": ...,
      "language": "...",
      "genres": [...],
      "description": "..."
    },
    ...
  ]
}
`.trim();

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`Deepseek API error: ${rawText}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Failed to parse Deepseek response as JSON");
  }

  const enrichedPerfectMatch = await enrichMovieWithPoster(parsed.perfectMatch as Movie);
  const enrichedSuggestions = await Promise.all(
    (parsed.youMightAlsoLike || []).slice(0, 3).map((m: Movie) => enrichMovieWithPoster(m))
  );

  return {
    movie: enrichedPerfectMatch,
    explanation: parsed.explanation || "",
    suggestions: enrichedSuggestions
  };
}
