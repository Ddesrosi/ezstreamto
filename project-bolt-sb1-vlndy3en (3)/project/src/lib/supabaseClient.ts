import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    console.log("🔄 Création d'une nouvelle instance Supabase...");
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  } else {
    console.log("♻️ Réutilisation de l'instance existante Supabase.");
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

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

