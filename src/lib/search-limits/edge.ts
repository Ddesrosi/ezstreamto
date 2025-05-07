import { getClientIp as getIP } from "./get-ip";
import { getOrCreateUUID } from "../get-uuid";

type Mode = 'check' | 'consume';

const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

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

    const requestPromise = retryFetch('https://acmpivmrokzblypxdxbu.supabase.co/functions/v1/search-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Origin': window.location.origin,
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
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
    console.error('❌ validateSearch error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return {
      canSearch: true,
      remaining: 4,
      total: 5,
      isPremium: false,
      message: 'Default fallback – validation failed'
    };
  }
}

async function retryFetch(url: string, options: RequestInit, attempts = RETRY_ATTEMPTS): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (attempts <= 1) throw error;
    
    console.log(`🔄 Retrying fetch... ${attempts - 1} attempts remaining`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return retryFetch(url, options, attempts - 1);
  }
}
