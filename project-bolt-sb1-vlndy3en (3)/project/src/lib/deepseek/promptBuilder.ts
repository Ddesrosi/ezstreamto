import type { SearchPreferences } from './types';

export function buildSearchPrompt(preferences: SearchPreferences): string {
  const sections: string[] = [];
  
  // Validate preferences
  if (!preferences) {
    throw new Error('Search preferences are required');
  }

  // Start with the standard prompt header
  sections.push('Find the best recommendations based on these preferences:');

  // Mandatory fields (always included)
  sections.push(`- Content Type: ${preferences.contentType === 'movie' ? 'Movies' : 'TV Series'}`);
  sections.push(`- Mood: ${preferences.selectedMoods.join(', ')}`);
  sections.push(`- Genres: ${preferences.selectedGenres.join(', ')}`);

  // Premium-only fields
  if (preferences.isPremium) {
    // Keywords
    if (preferences.keywords.length > 0) {
      sections.push(`- Keywords: ${preferences.keywords.join(', ')}`);
    }

    // Perfect Match
    if (preferences.isPerfectMatch) {
      sections.push('- Looking for a perfect match!');
    }

    // Specific Year
    if (preferences.specificYear) {
      sections.push(`- Year: ${preferences.specificYear}`);
    } else if (preferences.yearRange) {
      sections.push(`- Year Range: ${preferences.yearRange.from}-${preferences.yearRange.to}`);
    }

    // Rating Range (if not default)
    if (preferences.ratingRange.min > 0 || preferences.ratingRange.max < 10) {
      sections.push(`- Rating Range: ${preferences.ratingRange.min.toFixed(1)}-${preferences.ratingRange.max.toFixed(1)}`);
    }
  }

  // Optional fields (available to all users)
  if (preferences.selectedServices.length > 0) {
    sections.push(`- Available on: ${preferences.selectedServices.join(', ')}`);
  }

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Search Prompt:', {
      isPremium: preferences.isPremium,
      contentType: preferences.contentType,
      moods: preferences.selectedMoods,
      genres: preferences.selectedGenres,
      keywords: preferences.keywords,
      perfectMatch: preferences.isPerfectMatch,
      yearRange: preferences.yearRange,
      specificYear: preferences.specificYear,
      ratingRange: preferences.ratingRange,
      services: preferences.selectedServices
    });
  }

  return sections.join('\n');
}