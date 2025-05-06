import { getClientIp as getIP } from "./get-ip";
import { getOrCreateUUID } from "../get-uuid";

type Mode = 'check' | 'consume';

const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds

export async function validateSearch(mode: Mode = 'check', uuid?: string) {
  if (mode === "check") {
    console.trace("🧪 TRACE: validateSearch('check') call stack");
  }

  try {
    const ip = await getIP();
    const finalUUID = uuid || getOrCreateUUID();

    console.log(`📍 Called validateSearch("${mode}")`);

    const cacheKey = `${ip}-${mode}`;
    const cachedRequest = requestCache.get(cacheKey);
    if (cachedRequest) {
      console.log("📦 Using cached request");
      return await cachedRequest;
    }

    const body = { ip, uuid: finalUUID, mode };

    console.log("📤 Request sent with body:", body);

    const requestPromise = fetch('https://acmpivmrokzblypxdxbu.functions.supabase.co/search-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        // 🆕 Ajout essentiel :
        'Origin': window.location.origin
      },
      body: JSON.stringify(body)
    }).then(async (response) => {
      const result = await response.json();
      console.log('✅ validateSearch returned', result);
      return result;
    });

    requestCache.set(cacheKey, requestPromise);
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
