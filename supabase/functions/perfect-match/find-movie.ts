import type { Movie } from '../_shared/types.ts';
import type { SearchPreferences } from '../_shared/deepseek/types.ts';
import { enrichMovieWithPoster } from '../_shared/tmdb.ts';

// Simulation temporaire (à remplacer plus tard par une vraie recherche TMDB)
export async function findPerfectMatchMovie(preferences: SearchPreferences): Promise<Movie> {
  console.log("🎯 [Backend] Finding perfect match movie with:", preferences);

  // Exemple simulé
  const simulatedMovie: Movie = {
    id: crypto.randomUUID(),
    title: "Inception",
    year: 2010,
    rating: 8.8,
    duration: 148,
    language: "EN",
    genres: ["Sci-Fi", "Action", "Thriller"],
    description: "A skilled thief enters dreams to steal secrets.",
    imageUrl: "",
    streamingPlatforms: []
  };

  // ✅ Étape 2 : enrichir le film simulé
  const enrichedMovie = await enrichMovieWithPoster(simulatedMovie);

  return enrichedMovie;
}
