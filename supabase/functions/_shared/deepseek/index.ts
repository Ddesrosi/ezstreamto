import { SearchPreferences } from "./types.ts";
import { getDeepseekApiKey } from "../config.ts";

export async function getMovieRecommendations(preferences: SearchPreferences) {
  const DEEPSEEK_API_KEY = getDeepseekApiKey();
  if (!DEEPSEEK_API_KEY) throw new Error("Missing Deepseek API key");

  const prompt = `
You are a movie recommendation AI.
The user is searching with the following criteria:
- Content Type: ${preferences.contentType}
- Mood: ${preferences.selectedMoods.join(", ")}
- Genres: ${preferences.selectedGenres.join(", ")}
- Year Range: ${preferences.yearRange.from} to ${preferences.yearRange.to}
- Rating: ${preferences.ratingRange.min} to ${preferences.ratingRange.max}

Return a list of 5 to 10 movie recommendations as JSON array, each with:
- title
- year
- rating
- duration
- language
- genres
- description

Do not include anything outside the JSON array.
`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (e) {
    console.error("❌ Deepseek response parse error:", rawText);
    throw new Error("Invalid response from Deepseek");
  }
}
