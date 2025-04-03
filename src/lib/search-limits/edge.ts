import { getIP } from "./get-ip";

export async function validateSearch() {
  try {
    const ip = await getIP();
    console.log('🔍 Validating search for IP via Edge Function:', ip);

    const response = await fetch('https://acmpivmrokzblypxdxbu.functions.supabase.co/search-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ ip })
    });

    const result = await response.json();
    console.log('✅ Edge Function result:', result);

    return result;
  } catch (error) {
    console.error('❌ validateSearch via Edge error:', error);
    return {
      canSearch: true,
      remaining: 4,
      total: 5,
      isPremium: false,
      message: 'Default fallback response – validation failed'
    };
  }
}
