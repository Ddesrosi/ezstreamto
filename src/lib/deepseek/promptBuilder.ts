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

  const resultCount = preferences.isPremium && !preferences.isPerfectMatch ? 10 : 5;
  const typeLabel = contentType === 'movie' ? 'movies' : 'TV series';

  const promptLines = [];

  promptLines.push(
    `You are an expert AI assistant specialized in recommending movies and TV shows.`,
    `Based on the preferences below, recommend exactly ${resultCount} ${typeLabel} in JSON format.`,
    ``,
    `⚠️ Important rules:`,
    `- Do not include any text or explanation before or after the JSON.`,
    `- Do not wrap the JSON in code blocks.`,
    `- The response MUST start with [ and end with ].`,
    `- All keys must be in double quotes.`,
    `- Use only standard JSON syntax (no comments, no trailing commas).`,
    ``,
    `Return only an array of JSON objects with the following fields:`,
    `"title", "year", "rating", "description", "duration", "language", "genres", "popularity"`
  );

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
    `\nExample:`,
    `[`,
    `  {`,
    `    "title": "Inception",`,
    `    "year": 2010,`,
    `    "rating": 8.8,`,
    `    "description": "A skilled thief enters dreams to steal secrets.",`,
    `    "duration": 148,`,
    `    "language": "EN",`,
    `    "genres": ["Sci-Fi", "Thriller"],`,
    `    "popularity": 92`,
    `  }`,
    `]`
  );

  return promptLines.join('\n');
}
