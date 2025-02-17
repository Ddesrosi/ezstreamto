import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance with proper configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'ezstreamto-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Development helper to check if Supabase is connected
if (import.meta.env.DEV) {
  supabase.from('movies')
    .select('*')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.warn('Supabase connection test failed:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    })
    .catch(err => {
      console.warn('Supabase connection test error:', err.message);
    });
}

// Singleton pattern to prevent multiple instances
let instance: typeof supabase | null = null;

export function getSupabaseClient() {
  if (!instance) {
    instance = supabase;
  }
  return instance;
}

// ✅ TEST : Vérifier si Supabase reçoit bien les requêtes
(async () => {
  try {
    console.log("🔍 Test de connexion Supabase en cours...");
    
    const { data, error } = await supabase
      .from('ip_searches')
      .select('*')
      .limit(1);

    if (error) {
      console.error("❌ Test Supabase échoué :", error.message);
    } else if (data.length > 0) {
      console.log("✅ Test Supabase réussi, données reçues :", data);
    } else {
      console.warn("⚠️ Test Supabase réussi, mais aucune donnée trouvée.");
    }
  } catch (err) {
    console.error("❌ Erreur critique Supabase :", err);
  }
})();
