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

  const promptLines = [];

  promptLines.push(
    `You are an AI movie recommendation assistant.`,
    `Your task is to return a raw JSON array of exactly ${isPremium ? '10' : '5'} ${contentType === 'movie' ? 'movies' : 'TV series'} that match the following criteria.`
  );

  promptLines.push(`\nStrictly use this format. Do NOT include titles, lists, Markdown, or explanations. Respond ONLY with a valid JSON array.`);

  promptLines.push('\nMatching criteria:');

  if (selectedMoods.length > 0) {
    promptLines.push(`- Mood(s): ${selectedMoods.join(', ')}`);
  }

  if (selectedGenres.length > 0) {
    promptLines.push(`- Genre(s): ${selectedGenres.join(', ')}`);
  }

  if (specificYear && isPremium) {
    promptLines.push(`- Release Year: ${specificYear}`);
  } else if (yearRange?.from && yearRange?.to) {
    promptLines.push(`- Release Between: ${yearRange.from} and ${yearRange.to}`);
  }

  if (isPremium && keywords.length > 0) {
    promptLines.push(`- Keywords: ${keywords.join(', ')}`);
  }

  if (isPremium && (ratingRange.min > 0 || ratingRange.max < 10)) {
    promptLines.push(`- Rating between ${ratingRange.min} and ${ratingRange.max}`);
  }

  promptLines.push(
    `\nEach movie object in the array must include exactly these fields:`,
    `title, year, rating, description, duration, language, genres`
  );

  promptLines.push(
    `\nOutput Example (must be JSON only):`,
    `[{"title":"The Matrix","year":1999,"rating":8.7,"description":"A computer programmer discovers a dystopian world.","duration":136,"language":"EN","genres":["Action","Sci-Fi"]}]`
  );

  return promptLines.join('\n');
}

/**
 * Validates search preferences before building prompt
 */
export function validatePreferences(preferences: SearchPreferences): string | null {
  if (!preferences.contentType) {
    return 'Content type is required';
  }

  if (preferences.selectedGenres.length === 0 && preferences.selectedMoods.length === 0) {
    return 'At least one genre or mood is required';
  }

  if (preferences.yearRange.from > preferences.yearRange.to) {
    return 'Invalid year range';
  }

  if (preferences.ratingRange.min > preferences.ratingRange.max) {
    return 'Invalid rating range';
  }

  // Premium feature validation
  if (!preferences.isPremium) {
    if (preferences.keywords.length > 0) {
      return 'Keywords are a premium feature';
    }
    if (preferences.specificYear) {
      return 'Specific year selection is a premium feature';
    }
    if (preferences.isPerfectMatch) {
      return 'Perfect match is a premium feature';
    }
  }

  return null;
}
