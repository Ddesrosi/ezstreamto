// 🔁 Mappage des noms de plateformes TMDB → noms standardisés EzStreamTo

export const PLATFORM_ALIASES: Record<string, string> = {
  "Netflix": "Netflix",
  "Amazon Prime Video": "Amazon Prime",
  "Disney Plus": "Disney+",
  "HBO Max": "HBO Max",
  "Apple TV": "Apple TV+",
  "Hulu": "Hulu",
  "Paramount Plus": "Paramount+",
  "Peacock": "Peacock",
};

export function normalizePlatformName(name: string): string | null {
  return PLATFORM_ALIASES[name] || null;
}
