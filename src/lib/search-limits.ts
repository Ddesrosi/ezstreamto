import { supabase } from './supabaseClient';

// Cache IP address to reduce API calls
let cachedIP: string | null = null;
let ipCacheTime: number | null = null;
const IP_CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function getIP(): Promise<string> {
  try {
    // Check cache first
    if (cachedIP && ipCacheTime && Date.now() - ipCacheTime < IP_CACHE_DURATION) {
      return cachedIP;
    }

    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    if (!data?.ip) {
      throw new Error('Invalid IP response format');
    }
    
    // Update cache
    cachedIP = data.ip;
    ipCacheTime = Date.now();
    
    return data.ip;
  } catch (error) {
    console.warn('IP fetch failed:', error);
    // Use session-based fallback
    if (!cachedIP) {
      cachedIP = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      ipCacheTime = Date.now();
    }
    return cachedIP;
  }
}

export async function validateSearch() {
  try {
    const ip = await getIP();
    
    // Get search count for today
    const today = new Date().toISOString().split('T')[0];
    const { data: searches, error } = await supabase
      .from('ip_searches')
      .select('*')
      .eq('ip_address', ip)
      .single();

    if (error) {
      console.error('❌ Failed to get search count:', error.message);
      return { 
        status: 'free',
        canSearch: true,
        remaining: 5,
        total: 5,
        message: 'Free user - limited searches'
      };
    }

    // If no searches today or last search was yesterday, reset count
    if (!searches || new Date(searches.last_search).toISOString().split('T')[0] !== today) {
      return { 
        status: 'free',
        canSearch: true,
        remaining: 4,
        total: 5,
        message: 'Free user - limited searches'
      };
    }

    const remaining = Math.max(0, 5 - searches.search_count);
    
    return {
      status: 'free',
      canSearch: remaining > 0,
      remaining,
      total: 5,
      message: remaining > 0 
        ? `Free user - ${remaining} searches remaining`
        : 'Daily search limit reached. Support us to get unlimited searches!'
    };

  } catch (error) {
    console.error('Search validation error:', error);
    return { 
      status: 'free',
      canSearch: true,
      remaining: 5,
      total: 5,
      message: 'Free user - limited searches'
    };
  }
}