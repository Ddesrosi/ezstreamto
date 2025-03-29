// Define streaming platform types and helpers
export const APPROVED_PLATFORMS = {
  'Netflix': {
    color: '#E50914',
    bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
    textColor: 'text-white shadow-red-900/20',
    shortName: 'Netflix',
    matches: ['Netflix', 'Netflix Basic', 'Netflix Premium', 'Netflix with ads', 'Netflix Kids'],
    searchUrl: 'https://www.netflix.com/search?q='
  },
  'Amazon Prime': {
    color: '#0073E6',
    bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700',
    textColor: 'text-white shadow-blue-900/20',
    shortName: 'Prime',
    matches: ['Amazon Prime', 'Amazon Prime Video', 'Prime Video', 'Amazon Prime with ads', 'Amazon Video'],
    searchUrl: 'https://www.amazon.com/s?k={QUERY}&i=instant-video'
  },
  'Disney+': {
    color: '#113CCF',
    bgColor: 'bg-gradient-to-r from-blue-700 to-blue-800',
    textColor: 'text-white shadow-blue-900/20',
    shortName: 'Disney+',
    matches: ['Disney+', 'Disney Plus', 'Disney+ Basic', 'Disney+ Premium', 'Disney Plus'],
    searchUrl: 'https://www.disneyplus.com/search?q='
  },
  'HBO Max': {
    color: '#6E00F5',
    bgColor: 'bg-gradient-to-r from-purple-600 to-purple-700',
    textColor: 'text-white shadow-purple-900/20',
    shortName: 'HBO',
    matches: ['HBO Max', 'HBO', 'Max', 'HBO with ads', 'HBO Go', 'HBO Now'],
    searchUrl: 'https://play.max.com/search?q='
  },
  'Apple TV+': {
    color: '#333333',
    bgColor: 'bg-gradient-to-r from-gray-900 to-gray-800',
    textColor: 'text-white shadow-gray-900/20',
    shortName: 'Apple TV+',
    matches: ['Apple TV+', 'Apple TV Plus', 'Apple TV', 'iTunes'],
    searchUrl: 'https://tv.apple.com/search?term='
  },
  'Hulu': {
    color: '#1CE783',
    bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
    textColor: 'text-white shadow-green-900/20',
    shortName: 'Hulu',
    matches: ['Hulu', 'Hulu (No Ads)', 'Hulu with ads', 'Hulu Plus'],
    searchUrl: 'https://www.hulu.com/search?q='
  },
  'Paramount+': {
    color: '#0057B8',
    bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700',
    textColor: 'text-white shadow-blue-900/20',
    shortName: 'Para+',
    matches: ['Paramount+', 'Paramount Plus', 'Paramount+ Premium', 'Paramount Network'],
    searchUrl: 'https://www.paramountplus.com/search/{QUERY}/'
  },
  'Peacock': {
    color: '#0096A5',
    bgColor: 'bg-gradient-to-r from-teal-500 to-teal-600',
    textColor: 'text-white shadow-teal-900/20',
    shortName: 'Peacock',
    matches: ['Peacock', 'Peacock Premium', 'Peacock Premium Plus', 'Peacock TV'],
    searchUrl: 'https://www.peacocktv.com/search?q='
  }
} as const;

export function getPlatformStyle(platform: string) {
  const approvedPlatform = Object.entries(APPROVED_PLATFORMS).find(([name, data]) => 
    data.matches.includes(platform) || name === platform
  );

  return approvedPlatform ? {
    name: approvedPlatform[0],
    ...approvedPlatform[1]
  } : null;
}