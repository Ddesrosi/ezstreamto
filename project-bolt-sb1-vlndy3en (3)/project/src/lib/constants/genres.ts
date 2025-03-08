// Genre mapping between our application genres and TMDB genre IDs
export const genreMap: Record<string, number> = {
  'Action': 28,
  'Adventure': 12,
  'Animation': 16,
  'Biography': 36,
  'Comedy': 35,
  'Crime': 80,
  'Documentary': 99,
  'Drama': 18,
  'Family': 10751,
  'Fantasy': 14,
  'Film-Noir': 9648,
  'History': 36,
  'Horror': 27,
  'Musical': 10402,
  'Mystery': 9648,
  'Romance': 10749,
  'Sci-Fi': 878,
  'Sport': 10751,
  'Superhero': 28,
  'Thriller': 53,
  'War': 10752,
  'Western': 37
};

// Reverse mapping for genre ID to name
export const genreIdMap = Object.fromEntries(
  Object.entries(genreMap).map(([name, id]) => [id, name])
);

// Helper function to convert TMDB genre IDs to our genre names
export function mapTMDBGenres(genreIds: number[]): string[] {
  return genreIds
    .map(id => genreIdMap[id])
    .filter((name): name is string => Boolean(name));
}