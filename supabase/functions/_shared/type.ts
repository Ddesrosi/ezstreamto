// 🧩 Types partagés entre les fonctions (perfect-match, validate-search, etc.)

export interface Movie {
  id: string;
  title: string;
  year?: number;
  rating?: number;
  duration?: number;
  language?: string;
  genres?: string[];
  description?: string;
  imageUrl?: string;
  streamingPlatforms?: string[];
}

export interface SearchPreferences {
  contentType: "Movies" | "TV Series";
  selectedMoods: string[];
  selectedGenres: string[];
  yearRange?: string;
  specificYear?: string;
  ratingRange?: string;
  keywords?: string;
  isPremium: boolean;
  isPerfectMatch: boolean;
}
