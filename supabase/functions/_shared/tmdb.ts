// 📦 TMDB API client for enriching movie data
const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

if (!TMDB_API_KEY) {
  throw new Error("❌ TMDB_API_KEY is missing from environment variables.");
}

export interface Movie {
  title: string;
  year?: number;
  id?: string;
  rating?: number;
  duration?: number;
  language?: string;
  genres?: string[];
  description?: string;
  imageUrl?: string;
  streamingPlatforms?: string[];
}

export async function enrichMovieWithPoster(title: string, year?: number): Promise<Partial<Movie>> {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: title,
    include_adult: "false",
  });

  const url = `${TMDB_BASE_URL}/search/movie?${query.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("❌ TMDB search error:", res.status, await res.text());
    return {};
  }

  const data = await res.json();
  const result = data.results?.[0];

  if (!result) return {};

  const movieId = result.id;
  const detailsUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers`;

  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    console.error("❌ TMDB details fetch error:", detailsRes.status, await detailsRes.text());
    return {};
  }

  const details = await detailsRes.json();

  return {
    title: result.title,
    year: parseInt(result.release_date?.slice(0, 4)),
    imageUrl: result.poster_path
      ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
      : undefined,
    description: result.overview,
    rating: details.vote_average,
    duration: details.runtime,
    genres: details.genres?.map((g: any) => g.name),
    language: details.original_language?.toUpperCase(),
    streamingPlatforms: extractPlatforms(details["watch/providers"]),
  };
}

function extractPlatforms(providerData: any): string[] {
  const results = providerData?.results?.["US"]; // You can localize this
  if (!results) return [];

  const all = [
    ...(results.flatrate || []),
    ...(results.rent || []),
    ...(results.buy || []),
  ];

  const platforms = new Set<string>();
  for (const item of all) {
    if (item.provider_name) {
      platforms.add(item.provider_name);
    }
  }

  return Array.from(platforms);
}
