import type { SearchPreferences } from './types';

export function buildSearchPrompt(preferences: SearchPreferences): string {
  const {
    contentType,
    selectedGenres,
    selectedMoods,
    keywords,
    yearRange,
    specificYear,
    ratingRange,
    isPremium,
    isPerfectMatch
  } = preferences;

  const resultCount = isPremium ? 10 : 5;
  const typeLabel = contentType === 'movie' ? 'movies' : 'TV series';

  const promptLines = [];

  promptLines.push(
    `You are an expert AI assistant specialized in recommending ${typeLabel}.`,
    `Recommend exactly ${resultCount} ${typeLabel} that match the user's preferences below.`,
    `Results must be available at least in English.`,
    `Only return a raw valid JSON array of ${typeLabel}.`,
    `Do NOT include explanations, markdown, text, or formatting outside the array.`
  );

  promptLines.push(`\nUser Preferences:`);

  // Required criteria
  promptLines.push(`- Mood(s): ${selectedMoods.join(', ')}`);
  promptLines.push(`- Genre(s): ${selectedGenres.join(', ')}`);

  // Optional: Time Period → derived from yearRange
  if (specificYear && isPremium) {
    promptLines.push(`- Specific Year: ${specificYear}`);
  } else if (yearRange?.from && yearRange?.to) {
    promptLines.push(`- Release between 1970 and ${yearRange.to}`);
  }

  // Optional: Keywords (Premium only)
  if (isPremium && keywords.length > 0) {
    promptLines.push(`- Keywords: ${keywords.join(', ')} (selected from a predefined list)`);
  }

  // Optional: Rating Range (Premium only)
  if (isPremium && (ratingRange.min > 0 || ratingRange.max < 10)) {
    promptLines.push(`- Rating between ${ratingRange.min} and ${ratingRange.max}`);
  }

  promptLines.push(
    `\nRules:`,
    `- Do NOT include any movie classified as \"Documentary\" unless \"Documentary\" was explicitly selected as a genre.`,
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
