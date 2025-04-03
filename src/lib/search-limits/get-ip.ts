// src/lib/search-limits/get-ip.ts

let cachedIP: string | null = null;
let ipCacheTime: number | null = null;
const IP_CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function getIP(): Promise<string> {
  try {
    // Return from cache if valid
    if (cachedIP && ipCacheTime && Date.now() - ipCacheTime < IP_CACHE_DURATION) {
      return cachedIP;
    }

    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();

    if (!data?.ip) throw new Error('Invalid IP format from API');

    cachedIP = data.ip;
    ipCacheTime = Date.now();
    return cachedIP;
  } catch (error) {
    console.warn('🔻 Fallback IP used (session-based):', error);
    if (!cachedIP) {
      cachedIP = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      ipCacheTime = Date.now();
    }
    return cachedIP;
  }
}
