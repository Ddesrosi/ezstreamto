// Update search validation to use proper error handling
export async function validateSearch() {
  console.log("🔍 validateSearch() a été appelée !"); // 🛠 DEBUG
  try {
    const supabase = getSupabaseClient();
    
    // For development/testing, return unlimited searches
    if (import.meta.env.DEV) {
      return {
        canSearch: true,
        remaining: 999,
        total: 999,
        isPremium: true
      };
    }

    const { data, error } = await supabase.functions.invoke('validate-search', {
      body: { ip: await getIP() },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("📊 Données retournées par validate-search :", data); // 🛠 DEBUG

    if (error) {
      console.warn('⚠️ Search validation failed:', error);
      // Fallback to allow searching
      return { 
        canSearch: true,
        remaining: 3,
        total: 5,
        message: 'Limited searches available (fallback mode)'
      };
    }

    return data;
  } catch (error) {
    console.error('❌ Search validation error:', error);
    // Conservative fallback
    return { 
      canSearch: true,
      remaining: 2,
      total: 5,
      message: 'Emergency fallback mode - limited functionality'
    };
  }
}
