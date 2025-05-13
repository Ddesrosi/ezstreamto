import type { SearchPreferences, Movie } from "@/types";

export function generatePerfectMatchExplanationPrompt(
  preferences: SearchPreferences,
  movie: Movie
): string {
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
  ]
    .filter(Boolean)
    .join("\n- ");

  return `
You are an expert in movie recommendations.

🎯 TASK:
Explain in 3 to 4 sentences why the movie "${movie.title}" is a perfect match based on the user's preferences below.
Keep the tone natural, as if you were speaking to a friend.
Do not mention that you're an AI or repeat the preferences explicitly.

🎬 USER PREFERENCES:
- Mood(s): ${required.moods}
- Genre(s): ${required.genres}
- Type: ${required.type}
${optional ? `- ${optional}` : ""}

📝 RESPONSE:
A short explanation only. No extra formatting. Do not return JSON.
`.trim();
}
