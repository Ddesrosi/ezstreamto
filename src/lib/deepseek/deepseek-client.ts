import { getClientIp } from "@/lib/search-limits/get-ip";
import { DEEPSEEK_API_KEY } from "@/config";

export async function fetchMovieListFromDeepseek(prompt: string) {
  try {
    const ip = await getClientIp();

    if (!ip) {
      console.error("❌ IP address is missing");
      throw new Error("Unable to determine your IP address. Please try again later.");
    }

    if (!DEEPSEEK_API_KEY) {
      console.error("❌ Deepseek API key is missing");
      throw new Error("Service configuration error. Please contact support.");
    }

    console.log("🔄 Calling Deepseek proxy function...");
    
    try {
      const res = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek-proxy", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Cache-Control": "no-cache",
          "Origin": window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify({ prompt, ip })
      });

      if (!res.ok) {
        let errorMessage = "Failed to get movie recommendations";
        try {
          const errorData = await res.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error JSON, use the status text
          errorMessage = `Service error (${res.status}): ${res.statusText}`;
        }
        
        console.error("❌ Deepseek proxy error:", {
          status: res.status,
          statusText: res.statusText,
          message: errorMessage
        });
        
        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      console.log("✅ Received response from Deepseek proxy");

      const { rawMovies } = responseData;

      if (!rawMovies?.choices?.[0]?.message?.content) {
        console.error("❌ Invalid response structure:", responseData);
        throw new Error("Received invalid response format from the service");
      }

      let content = rawMovies.choices[0].message.content;

      // Clean up Markdown blocks if present
      if (content.includes("```")) {
        content = content.replace(/```(?:json)?/g, "").trim();
      }

      let movieData;
      try {
        movieData = JSON.parse(content);
      } catch (e) {
        console.error("❌ Failed to parse movie data:", e);
        throw new Error("Failed to process movie recommendations");
      }

      if (!Array.isArray(movieData)) {
        console.error("❌ Movie data is not an array:", movieData);
        throw new Error("Received invalid movie data format");
      }

      return {
        rawMovies: movieData,
        remaining: responseData.remaining,
        isPremium: responseData.isPremium
      };

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error("❌ Network error:", error);
        throw new Error("Unable to connect to the recommendation service. Please check your internet connection and try again.");
      }
      throw error;
    }

  } catch (error) {
    console.error("❌ Error in fetchMovieListFromDeepseek:", error);
    throw new Error(error.message || "Failed to fetch movie recommendations");
  }
}