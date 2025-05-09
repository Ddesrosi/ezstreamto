import { getClientIp } from "@/lib/search-limits/get-ip";

console.log("🔑 VITE_DEEPSEEK_API_KEY =", import.meta.env.VITE_DEEPSEEK_API_KEY);

export async function fetchMovieListFromDeepseek(prompt: string) {
  const ip = await getClientIp();

  if (!ip) {
    console.error("❌ IP address is missing");
    throw new Error("Missing IP address");
  }

  const res = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ prompt, ip })
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    console.error("❌ Deepseek proxy error:", errorDetails);
    throw new Error(`Failed to fetch movie recommendations: ${errorDetails}`);
  }

  const responseData = await res.json();
  console.log("🧪 responseData received from deepseek-proxy:", responseData);

  // Check for both rawText and rawMovies
  if (!responseData.rawText && !responseData.rawMovies) {
    console.error("❌ Invalid response from Deepseek proxy:", responseData);
    throw new Error("No movie recommendations received from the server");
  }

  let movieData;

  try {
    let content = "";

    if (responseData.rawText) {
      console.log("🪵 Received rawText from Deepseek.");
      const parsed = JSON.parse(responseData.rawText);
      content = parsed?.choices?.[0]?.message?.content;
    } else if (responseData.rawMovies?.choices?.[0]?.message?.content) {
      console.log("🪵 Received rawMovies from Deepseek (new format).");
      content = responseData.rawMovies.choices[0].message.content;
    } else {
      console.error("❌ Invalid Deepseek format: neither rawText nor valid rawMovies");
      throw new Error("Unrecognized response format from Deepseek");
    }

    if (!content) {
      throw new Error("Empty content from Deepseek");
    }

    // 🧼 Nettoyer bloc Markdown si présent
    if (content.includes("```")) {
      content = content.replace(/```(?:json)?/g, "").trim();
    }

    console.log("📦 Deepseek content to parse:", content);

const parsedData = JSON.parse(content);
movieData = parsedData.movies;

    if (!Array.isArray(movieData)) {
      throw new Error("Expected an array of movie objects");
    }

  } catch (e) {
    console.error("❌ Failed to parse movie data:", e);
    throw new Error("Failed to process movie recommendations: " + e.message);
  }

  if (!movieData || movieData.length === 0) {
    throw new Error("No movie recommendations found");
  }

  return {
    rawMovies: movieData,
    remaining: responseData.remaining,
    isPremium: responseData.isPremium
  };
}
