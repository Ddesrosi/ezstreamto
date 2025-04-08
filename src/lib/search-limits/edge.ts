import { getClientIp as getIP } from "./get-ip";

type Mode = 'check' | 'consume';

export async function validateSearch(mode: Mode = 'check') {
  try {
    const ip = await getIP();
    console.log(`🔍 Validating search (${mode}) for IP:`, ip);
    console.log("📍 Called validateSearch(\"check\")");

    const response = await fetch('https://acmpivmrokzblypxdxbu.functions.supabase.co/search-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        ip,
        mode: mode === 'check' ? 'check' : 'consume'
      })
    });

    // ✅ Nouveau log ici
    console.log("📨 Request sent with body:", { ip, mode });

    const result = await response.json();
    console.log('✅ validateSearch returned', result);
    return result;
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
