// Define approved streaming platforms and their properties
export const APPROVED_PLATFORMS = {
  'Netflix': {
    color: '#E50914',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    shortName: 'Netflix',
    matches: ['Netflix', 'Netflix Basic', 'Netflix Premium', 'Netflix with ads', 'Netflix Kids']
  },
  'Amazon Prime': {
    color: '#0073E6',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    shortName: 'Prime',
    matches: ['Amazon Prime', 'Amazon Prime Video', 'Prime Video', 'Amazon Prime with ads', 'Amazon Video']
  },
  'Disney+': {
    color: '#113CCF',
    bgColor: 'bg-blue-700',
    textColor: 'text-white',
    shortName: 'Disney+',
    matches: ['Disney+', 'Disney Plus', 'Disney+ Basic', 'Disney+ Premium', 'Disney Plus']
  },
  'HBO Max': {
    color: '#6E00F5',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    shortName: 'HBO',
    matches: ['HBO Max', 'HBO', 'Max', 'HBO with ads', 'HBO Go', 'HBO Now']
  },
  'Apple TV+': {
    color: '#333333',
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    shortName: 'Apple TV+',
    matches: ['Apple TV+', 'Apple TV Plus', 'Apple TV', 'iTunes']
  },
  'Hulu': {
    color: '#1CE783',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    shortName: 'Hulu',
    matches: ['Hulu', 'Hulu (No Ads)', 'Hulu with ads', 'Hulu Plus']
  },
  'Paramount+': {
    color: '#0057B8',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    shortName: 'Para+',
    matches: ['Paramount+', 'Paramount Plus', 'Paramount+ Premium', 'Paramount Network']
  },
  'Peacock': {
    color: '#0096A5',
    bgColor: 'bg-teal-500',
    textColor: 'text-white',
    shortName: 'Peacock',
    matches: ['Peacock', 'Peacock Premium', 'Peacock Premium Plus', 'Peacock TV']
  }
} as const;