import { getClientIp as getIP } from "./get-ip";
import { getOrCreateUUID } from "../get-uuid"; // ✅ ajout ici

type Mode = 'check' | 'consume';

const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds

export async function validateSearch(mode: Mode = 'check', uuid?: string) {
  if (mode === "check") {
    console.trace("🧪 TRACE: validateSearch('check') call stack");
  }

  try {
    const ip = await getIP();
    const finalUUID = uuid || getOrCreateUUID(); // ✅ Utilise le paramètre si fourni, sinon fallback

    console.log(`📍 Called validateSearch("${mode}")`);

    // Generate cache key based on IP and mode
    const cacheKey = `${ip}-${mode}`;

    // Check cache for recent requests
    const cachedRequest = requestCache.get(cacheKey);
    if (cachedRequest) {
      console.log("📦 Using cached request");
      return await cachedRequest;
    }

    const body = { ip, uuid: finalUUID, mode }; // ✅ Correction ici

    console.log("📤 Request sent with body:", body); // 🆕 Ajout ici

    // Create promise for the request
    const requestPromise = fetch('https://acmpivmrokzblypxdxbu.functions.supabase.co/search-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    }).then(async (response) => {
      const result = await response.json();
      console.log('✅ validateSearch returned', result);
      return result;
    });

    // Cache the request promise
    requestCache.set(cacheKey, requestPromise);

    // Set cache expiration
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_TTL);

    return await requestPromise;
  } catch (error) {
    console.error('❌ validateSearch error:', error);
    return {
      canSearch: true,
      remaining: 4,
      total: 5,
      isPremium: false,
      message: 'Default fallback – validation failed'
    };
  }
}
