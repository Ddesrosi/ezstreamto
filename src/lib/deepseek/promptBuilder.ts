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
    `You are an expert AI assistant specialized in recommending ${typeLabel}.`,
    `Recommend exactly ${resultCount} ${typeLabel} that match the preferences below.`,
    `Return ONLY a valid JSON array of recommendations.`,
    `Each recommendation must include these exact fields:`,
    `{`,
    `  "title": "Movie Title",`,
    `  "year": 2024,`,
    `  "rating": 8.5,`,
    `  "duration": 120,`,
    `  "language": "EN",`,
    `  "genres": ["Action", "Adventure"],`,
    `  "description": "A brief plot summary.",`,
    `  "popularity": 85`,
    `}`,
    `Do NOT include any explanations or text outside the JSON array.`
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
    `- Only include content available in English`,
    `- Only include content from 1970 onwards`,
    `- Ensure all JSON strings are properly escaped`,
    `- Use double quotes for all JSON strings`,
    `- Do not use special characters that need escaping`
  );

  return promptLines.join('\n');
}
