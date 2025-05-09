import { getDeepseekApiKey } from "../_shared/config.ts";
import { enrichMovieWithPoster } from "../_shared/tmdb.ts";
import type { Movie, SearchPreferences } from "../_shared/types.ts";

export async function generatePerfectMatchInsights(preferences: SearchPreferences, req: Request)
{
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

 const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/deepseek-proxy`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
  },
  body: JSON.stringify({ prompt, ip, uuid: "perfect-match-server" })
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
    insights: {
      reason: parsed.explanation || "",
      similar: enrichedSuggestions
    }
  };
} // ✅ cette accolade ferme la fonction generatePerfectMatchInsights
