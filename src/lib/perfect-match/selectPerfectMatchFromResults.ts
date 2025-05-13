import type { Movie } from "@/types";

export function selectPerfectMatchFromResults(movies: Movie[]) {
  if (!movies || movies.length === 0) {
    throw new Error("No movies available to select Perfect Match.");
  }

  // Trier les films par popularité décroissante
  const sorted = movies
    .filter(m => m.popularity !== undefined)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const main = sorted[0];
  const similar = sorted.slice(1, 4); // max 3 suggestions

  return {
    main,
    similar
  };
}
