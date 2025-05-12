import { getClientIp } from "@/lib/search-limits/get-ip";
import { getOrCreateUUID } from "@/lib/search-limits/get-uuid";
import { supabase } from '@/lib/supabaseClient';
import { DEEPSEEK_API_KEY } from "@/config";

console.log("🔑 VITE_DEEPSEEK_API_KEY =", import.meta.env.VITE_DEEPSEEK_API_KEY);

function sanitizeJsonString(str: string): string {
  try {
    // First attempt: Try direct parse
    JSON.parse(str);
    return str;
  } catch (e) {
    // Second attempt: Clean and sanitize
    let sanitized = str;
    
    // Fix common JSON issues
    sanitized = sanitized
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ':"$1"')
      .replace(/([}\]])\s*([,}])/g, '$1$2')
      .replace(/([^"\\])"([^"\\]*)"(\s*[}\]])/g, '$1"$2"$3');
    
    // Fix array content
    sanitized = sanitized.replace(/\[\s*([^"\]\[]*?)\s*\]/g, (match, content) => {
      return `[${content.split(',')
        .map((item: string) => item.trim())
        .filter((item: string) => item)
        .map((item: string) => `"${item}"`)
        .join(',')}]`;
    });
    
    // Fix unterminated strings
    const matches = sanitized.match(/"([^"]*)/g);
    if (matches) {
      matches.forEach(match => {
        if (!match.endsWith('"')) {
          sanitized = sanitized.replace(match, `${match}"`);
        }
      });
    }
    
    // Ensure proper JSON structure
    if (!sanitized.endsWith('}') && sanitized.includes('recommendations')) {
      sanitized += '}';
    }
    
    return sanitized;
  }
}

interface DeepseekResponse {
  rawMovies?: any[];
  rawText?: string;
  remaining?: number;
  isPremium?: boolean;
}

export async function fetchMovieListFromDeepseek(prompt: string) {
  const [ip, uuid] = await Promise.all([
    getClientIp(),
    getOrCreateUUID()
  ]);

  if (!ip || !uuid) {
    console.error("❌ Required identifiers missing:", { ip, uuid });
    throw new Error("Missing required identification (IP or UUID)");
  }

  console.log("🔍 Fetching recommendations with prompt:", prompt);

  // Check premium status before proceeding
  const { data: supporter } = await supabase
    .from('supporters')
    .select('*')
    .or(`visitor_uuid.eq.${uuid},email.eq.${localStorage.getItem('visitor_email')}`)
    .eq('verified', true)
    .maybeSingle();

  if (supporter?.unlimited_searches) {
    console.log('✨ Premium user detected, skipping search limit check');
  }

  console.log("📤 Sending request to Deepseek proxy with:", { prompt, ip, uuid });

  const response = await fetch("https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/deepseek-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ 
      prompt, 
      ip, 
      uuid,
      isPremium: !!supporter?.unlimited_searches
    })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("❌ Deepseek proxy error:", errorDetails);
    throw new Error(`Failed to fetch movie recommendations: ${errorDetails}`);
  }

  const responseData: DeepseekResponse = await response.json();
  console.log("🧪 Raw response from deepseek-proxy:", responseData);

  let movieData;
  let content = "";

  try {
    console.log("📥 Processing Deepseek response");

    // Handle different response formats
    if (responseData.rawMovies) {
      console.log("🩵 Processing rawMovies");
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
      console.log("🩵 Processing rawText");
      const parsed = JSON.parse(responseData.rawText);
      content = parsed?.choices?.[0]?.message?.content;
    }

    // If we have content but no movieData, try to parse it
    if (!movieData && content) {
      console.log("📦 Attempting to parse content:", content);

      try {
        // Clean and sanitize the content
        content = content.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        content = sanitizeJsonString(content);
        
        console.log("🧹 Sanitized content:", content);
        
        const parsedContent = JSON.parse(content);
        
        if (Array.isArray(parsedContent)) {
          movieData = parsedContent;
        } else if (parsedContent.recommendations || parsedContent.movies || parsedContent.tv_series) {
          movieData = parsedContent.recommendations || parsedContent.movies || parsedContent.tv_series;
        } else if (parsedContent.choices?.[0]?.message?.content) {
          const nested = parsedContent.choices[0].message.content;
          movieData = typeof nested === 'string' ? JSON.parse(nested) : nested;
        }
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        console.log("📄 Content that failed to parse:", content);
        throw new Error(`Invalid JSON format: ${parseError.message}`);
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
        typeof movie.title === 'string' &&
        Array.isArray(movie.genres);

      if (!isValid) {
        console.warn("⚠️ Filtered out invalid movie:", movie);
      }
      
      // Sanitize genres array if needed
      if (isValid && movie.genres) {
        movie.genres = movie.genres.map((genre: any) => 
          typeof genre === 'string' ? genre.trim() : ''
        ).filter(Boolean);
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
