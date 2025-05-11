import type { SearchPreferences } from './types';

export function buildSearchPrompt(preferences: SearchPreferences): string {
  const {
    contentType,
    selectedGenres,
    selectedMoods,
    keywords,
    yearRange,
    specificYear,
    ratingRange
  } = preferences;

  const resultCount = preferences.isPremium ? 10 : 5;
  const typeLabel = contentType === 'movie' ? 'movies' : 'TV series';

  const promptLines = [];

  promptLines.push(
    `You are an expert AI assistant specialized in recommending movies and TV shows.`,
    `Based on the preferences below, recommend ${resultCount} ${typeLabel} in a JSON format.`,
    `Each recommendation must include a popularity score (0-100) for sorting.`,
    `Return ONLY a valid JSON object with this exact structure:`,
    `{`,
    `  "recommendations": [`,
    `    {`,
    `      "title": "string",`,
    `      "year": number,`,
    `      "rating": number,`,
    `      "duration": number or "TV Series",`,
    `      "language": "string",`,
    `      "genres": ["string"],`,
    `      "description": "string",`,
    `      "popularity": number`,
    `    }`,
    `  ]`,
    `}`
  );

  // ✅ Ajout important pour forcer Deepseek à échapper les caractères
  promptLines.push(`Ensure all strings are properly escaped (e.g., using \\\" for quotes).`);

  promptLines.push(`\nUser Preferences:`);

  promptLines.push(`- Mood(s): ${selectedMoods.join(', ')}`);
  promptLines.push(`- Genre(s): ${selectedGenres.join(', ')}`);

  if (specificYear) {
    promptLines.push(`- Specific Year: ${specificYear}`);
  } else if (yearRange?.from && yearRange?.to) {
    promptLines.push(`- Release between ${yearRange.from} and ${yearRange.to}`);
  }

  if (keywords && keywords.length > 0) {
    promptLines.push(`- Keywords: ${keywords.join(', ')}`);
  }

  if (ratingRange && (ratingRange.min > 0 || ratingRange.max < 10)) {
    promptLines.push(`- Rating between ${ratingRange.min} and ${ratingRange.max}`);
  }

  promptLines.push(
    `\nRules:`,
    `- Do NOT include any movie classified as "Documentary" unless "Documentary" was explicitly selected as a genre.`,
    `- Only include movies or series that are available at least in English.`,
    `- Only include content released from 1970 onwards.`
  );

  promptLines.push(
    `\nEach item in the array must include exactly these fields:`,
    `"title", "year", "rating", "description", "duration", "language", "genres"`
  );

  promptLines.push(
    `\nOutput Example (JSON only):`,
    `[{"title":"Inception","year":2010,"rating":8.8,"description":"A skilled thief leads a team into dreams.","duration":148,"language":"EN","genres":["Sci-Fi","Thriller"]}]`
  );

  return promptLines.join('\n');
}
