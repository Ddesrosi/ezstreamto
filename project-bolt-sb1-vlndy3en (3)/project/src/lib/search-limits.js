import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qmrtpqjngwvmukbfioga.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnRwcWpuZ3d2bXVrYmZpb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MTM4MzMsImV4cCI6MjA1Mzk4OTgzM30.jsp51PwTqRCNXfh3cPws6T0SoiyS2_6Sf2M4vih2SmY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache IP address to reduce API calls
let cachedIP = null;
let ipCacheTime = null;
const IP_CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function getIP() {
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
    // Free user limits
    return { 
      status: 'free',
      canSearch: true,
      remaining: 4,
      total: 5,
      message: 'Free user - limited searches'
    };

    // NOTE: The following code is preserved for when Edge Functions are deployed
    /*
    const ip = await getIP();
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-search', {
        body: { ip },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Empty response from validation service');
      }

      switch (data.status) {
        case 'premium':
          return { canSearch: true };
          
        case 'limit_reached':
          return {
            canSearch: false,
            message: 'You have reached your daily search limit. Support us to get unlimited searches!'
          };
          
        case 'ok':
          return {
            canSearch: true,
            remaining: data.remaining,
            total: data.total
          };
          
        default:
          throw new Error(`Unknown status: ${data.status}`);
      }
    } catch (error) {
      console.warn('Search validation failed:', error);
      return { 
        canSearch: true,
        remaining: 2,
        total: 5,
        message: 'Limited searches available (fallback mode)'
      };
    }
    */
  } catch (error) {
    console.error('Search validation error:', error);
    return { 
      canSearch: true,
      remaining: 4,
      total: 5,
      message: 'Free user - limited searches'
    };
  }
}

export async function verifySupport(transactionId) {
  if (!transactionId?.trim()) {
    console.warn('Invalid transaction ID provided');
    return false;
  }

  // Development mode - always return successful verification
  return true;

  // NOTE: The following code is preserved for when Edge Functions are deployed
  /*
  try {
    const ip = await getIP();
    
    const { data, error } = await supabase
      .functions.invoke('verify-support', {
        body: { 
          transaction_id: transactionId.trim(), 
          ip_address: ip 
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

    if (error) {
      throw error;
    }

    return data?.status === 'success';
  } catch (error) {
    console.error('Support verification error:', error);
    return false;
  }
  */
}