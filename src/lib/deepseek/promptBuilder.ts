import type { SearchPreferences } from './types';

/**
 * Builds a structured search prompt for Deepseek based on user preferences
 */
export function buildSearchPrompt(preferences: SearchPreferences): string {
  if (!preferences) {
    throw new Error('Search preferences are required');
  }

  const promptLines: string[] = [];

  // Content Type - Critical Base Requirement
  promptLines.push(
    `Find ${preferences.contentType === 'movie' ? 'Movies' : 'TV Series'} that EXACTLY match these requirements:`
  );

  // Genres - Primary Criteria
  if (preferences.selectedGenres.length > 0) {
    promptLines.push(
      'MUST include these genres:',
      preferences.selectedGenres.map(genre => `- ${genre}`).join('\n')
    );
  }

  // Moods - Emotional Context
  if (preferences.selectedMoods.length > 0) {
    promptLines.push(
      'MUST match these moods/themes:',
      preferences.selectedMoods.map(mood => `- ${mood}`).join('\n')
    );
  }

  // Year Range - Temporal Filter
  const yearRange = preferences.yearRange;
  if (preferences.specificYear && preferences.isPremium) {
    promptLines.push(`MUST be from exactly year: ${preferences.specificYear}`);
  } else if (yearRange) {
    promptLines.push(
      `MUST be released between ${yearRange.from} and ${yearRange.to}`
    );
  }

  // Rating Range - Quality Filter
  const ratingRange = preferences.ratingRange;
  if (ratingRange) {
    promptLines.push(
      `MUST have rating between ${ratingRange.min} and ${ratingRange.max}`
    );
  }

  // Keywords - Premium Feature
  if (preferences.isPremium && preferences.keywords.length > 0) {
    promptLines.push(
      'MUST include these themes or elements:',
      preferences.keywords.map(keyword => `- ${keyword}`).join('\n')
    );
  }

  // Perfect Match Instructions
  if (preferences.isPerfectMatch && preferences.isPremium) {
    promptLines.push(
      '\nProvide ONE perfect match with:',
      '1. Detailed explanation of why it matches',
      '2. Three similar recommendations',
      '3. Specific connections to user preferences'
    );
  } else {
    promptLines.push(
      '\nProvide recommendations that:',
      '1. STRICTLY follow all criteria above',
      '2. Are ordered by relevance',
      '3. Include brief explanations of matches'
    );
  }

  // Format Requirements
  promptLines.push(
    '\nFor each recommendation, return:',
    '- Title',
    '- Year',
    '- Genres',
    '- Rating',
    '- Brief description',
    '- Match explanation'
  );

  return promptLines.join('\n\n');
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