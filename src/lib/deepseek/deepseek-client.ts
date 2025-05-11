import { getClientIp } from "@/lib/search-limits/get-ip";
import { getOrCreateUUID } from "@/lib/search-limits/get-uuid";

console.log("🔑 VITE_DEEPSEEK_API_KEY =", import.meta.env.VITE_DEEPSEEK_API_KEY);

export async function fetchMovieListFromDeepseek(prompt: string) {
  const [ip, uuid] = await Promise.all([
    getClientIp(),
    getOrCreateUUID()
  ]);

  if (!ip || !uuid) {
    console.error("❌ Required identifiers missing:", { ip, uuid });
    throw new Error("Missing required identification (IP or UUID)");
  }

  const res = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ prompt, ip, uuid })
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    console.error("❌ Deepseek proxy error:", errorDetails);
    throw new Error(`Failed to fetch movie recommendations: ${errorDetails}`);
  }

  const responseData = await res.json();
  console.log("🧪 Raw response from deepseek-proxy:", responseData);

  let movieData;
  let content = "";

  try {
    // Handle different response formats
    if (responseData.rawMovies) {
      console.log("🪵 Processing rawMovies");
      if (Array.isArray(responseData.rawMovies)) {
        console.log("📦 rawMovies is an array");
        movieData = responseData.rawMovies;
      } else if (typeof responseData.rawMovies === 'string') {
        console.log("📦 rawMovies is a string, attempting to parse");
        content = responseData.rawMovies;
      } else if (responseData.rawMovies?.choices?.[0]?.message?.content) {
        console.log("📦 rawMovies has nested content");
        content = responseData.rawMovies.choices[0].message.content;
      }
    } else if (responseData.rawText) {
      console.log("🪵 Processing rawText");
      const parsed = JSON.parse(responseData.rawText);
      content = parsed?.choices?.[0]?.message?.content;
    }

    // If we have content but no movieData, try to parse it
    if (!movieData && content) {
      console.log("📦 Attempting to parse content:", content);
      
      // Clean Markdown blocks if present
      if (content.includes("```")) {
        content = content.replace(/```(?:json)?/g, "").trim();
      }

      try {
        const parsedContent = JSON.parse(content);
        // Handle both direct array and nested movie array formats
        movieData = Array.isArray(parsedContent)
  ? parsedContent
  : parsedContent.movies || parsedContent.tv_series;
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error("Failed to parse movie data: Invalid JSON format");
      }
    }

    if (!movieData || !Array.isArray(movieData)) {
      console.error("❌ Invalid or missing movie data:", movieData);
      throw new Error("No valid movie data found in the response");
    }

    // Validate and filter movie objects
    movieData = movieData.filter(movie => {
      const isValid = typeof movie === 'object' && 
                     movie !== null && 
                     typeof movie.title === 'string';
      
      if (!isValid) {
        console.warn("⚠️ Filtered out invalid movie:", movie);
      }
      return isValid;
    });

    if (movieData.length === 0) {
      throw new Error("No valid movies found in the response");
    }

    console.log("✅ Successfully processed movie data:", {
      count: movieData.length,
      firstMovie: movieData[0]?.title
    });

    return {
      rawMovies: movieData,
      remaining: responseData.remaining,
      isPremium: responseData.isPremium
    };

  } catch (e) {
    console.error("❌ Failed to process movie data:", e);
    throw new Error(`Failed to process movie recommendations: ${e.message}`);
  }
}