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
    throw new Error("Failed to fetch movie recommendations from Deepseek");
  }

  const responseData = await res.json();
  const { rawText, rawMovies } = responseData;

  if (!rawText && !rawMovies) {
    console.error("❌ Missing both rawText and rawMovies in Deepseek proxy response:", responseData);
    throw new Error("Invalid response from Deepseek proxy.");
  }

  let movieData;

  try {
    let content = "";

    if (rawText) {
      console.log("🪵 Received rawText from Deepseek.");
      const deepseekResponse = JSON.parse(rawText);

      if (!deepseekResponse?.choices?.[0]?.message?.content) {
        console.error("❌ Invalid Deepseek response structure:", deepseekResponse);
        throw new Error("Invalid response structure from Deepseek");
      }

      content = deepseekResponse.choices[0].message.content;

    } else if (rawMovies) {
      console.log("🪵 Received rawMovies from Deepseek (new format).");

      if (!rawMovies?.choices?.[0]?.message?.content) {
        console.error("❌ Invalid rawMovies response structure:", rawMovies);
        throw new Error("Invalid rawMovies structure: Missing content");
      }

      content = rawMovies.choices[0].message.content;
    }

    // 🧼 Nettoyer le bloc Markdown s'il existe
    if (content.includes("```")) {
      content = content.replace(/```(?:json)?/g, "").trim();
    }

    movieData = JSON.parse(content);

    if (!Array.isArray(movieData)) {
      console.error("❌ Movie data is not an array:", movieData);
      throw new Error("Invalid movie data format: Expected an array");
    }

  } catch (e) {
    console.error("❌ Failed to parse movie data:", e);
    throw new Error("Failed to parse movie recommendations: " + e.message);
  }

  return {
    rawMovies: movieData,
    remaining: responseData.remaining,
    isPremium: responseData.isPremium
  };
}
