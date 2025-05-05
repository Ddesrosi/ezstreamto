import { Movie } from '../_shared/types.ts';
import { enrichMovieWithPoster } from '../_shared/tmdb.ts';
import { DEEPSEEK_API_KEY } from '../_shared/config.ts';

interface PerfectMatchInsights {
  explanation: string;
  recommendations: Movie[];
}

export async function generatePerfectMatchInsights(
  movie: Movie,
  preferences: any
): Promise<PerfectMatchInsights> {
  console.log("🧠 Generating insights from backend");

  if (!DEEPSEEK_API_KEY) {
    throw new Error("Deepseek API key is missing");
  }

  const prompt = `
You are an expert movie recommender. A user is looking for a film based on these preferences:
- Mood: ${preferences.moods.join(", ")}
- Genre: ${preferences.genres.join(", ")}
- Year range: ${preferences.yearRange.from} to ${preferences.yearRange.to}
- Rating range: ${preferences.ratingRange.min} to ${preferences.ratingRange.max}

You selected the movie "${movie.title}" (${movie.year}) as the perfect match.

Now explain:
1. Why this movie is a perfect fit (3-4 sentences).
2. Suggest 3 similar movies with short reasons.

Format your response as JSON:
{
  "explanation": "...",
  "recommendations": [
    { "title": "...", "reason": "..." },
    { "title": "...", "reason": "..." },
    { "title": "...", "reason": "..." }
  ]
}
`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a movie recommendation assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log("📥 Deepseek raw response:\n", data);

  try {
    const text = data.choices?.[0]?.message?.content || '';
    console.log("📦 Raw Deepseek text response:\n", text);
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const jsonString = text.slice(jsonStart, jsonEnd + 1);

    const parsed = JSON.parse(jsonString);

    const recommendations = await Promise.all(
      parsed.recommendations.map(async (rec: any) => {
        const tempMovie: Movie = {
          id: crypto.randomUUID(),
          title: rec.title,
          year: rec.year || movie.year,
          rating: rec.rating || 7,
          duration: rec.duration || 120,
          language: rec.language || 'EN',
          genres: rec.genres || [],
          description: rec.reason || 'No description provided',
          imageUrl: '',
          streamingPlatforms: []
        };

        try {
          const enriched = await enrichMovieWithPoster(tempMovie);
          return enriched;
        } catch {
          return tempMovie;
        }
      })
    );

    return {
      explanation: parsed.explanation,
      recommendations
    };
  } catch (error) {
    console.error("❌ Failed to parse Deepseek response:", data);
    throw new Error("Invalid response from Deepseek");
  }
}

export function generateFallbackInsights(movie: Movie, preferences: any): PerfectMatchInsights {
  const fallbackYear = movie.year || 2000;
  const fallbackRating = movie.rating || 7.0;
  const fallbackLanguage = movie.language || 'EN';
  const fallbackDuration = preferences.contentType === 'tv' ? 'TV Series' : '120 min';

  return {
    explanation: `"${movie.title}" fits your preferences in ${movie.genres.join(", ")} and matches your ${preferences.moods.join(" and ").toLowerCase()} mood.`,
    recommendations: movie.genres.slice(0, 3).map((genre: string) => ({
      id: crypto.randomUUID(),
      title: `Sample ${genre} Movie`,
      year: fallbackYear,
      rating: fallbackRating,
      duration: fallbackDuration,
      language: fallbackLanguage,
      genres: [genre],
      description: `This film shares ${genre.toLowerCase()} elements with "${movie.title}".`,
      imageUrl: '',
      streamingPlatforms: []
    }))
  };
}
