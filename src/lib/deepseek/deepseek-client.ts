import { getClientIp } from "@/lib/search-limits/get-ip";

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

  if (!responseData.rawText) {
    console.error("❌ Missing rawText in Deepseek proxy response:", responseData);
    throw new Error("Invalid response from Deepseek proxy.");
  }

  let movieData;
  try {
    const deepseekResponse = JSON.parse(responseData.rawText);

    if (
      !deepseekResponse?.choices?.[0]?.message?.content
    ) {
      console.error("❌ Invalid Deepseek response structure:", deepseekResponse);
      throw new Error("Invalid response structure from Deepseek");
    }

    movieData = JSON.parse(deepseekResponse.choices[0].message.content);

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