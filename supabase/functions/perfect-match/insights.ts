import { Movie } from "./types.ts";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? '';

interface PerfectMatchInsights {
  explanation: string;
  recommendations: { title: string; reason: string }[];
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

  try {
    const jsonBlock = JSON.parse(data.choices[0].message.content);
    return jsonBlock;
  } catch (error) {
    console.error("❌ Failed to parse Deepseek response:", data);
    throw new Error("Invalid response from Deepseek");
  }
}
