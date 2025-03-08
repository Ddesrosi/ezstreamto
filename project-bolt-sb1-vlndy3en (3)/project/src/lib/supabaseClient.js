import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Create a single Supabase client instance with proper configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'ezstreamto-web'
    }
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
let instance = null;

export function getSupabaseClient() {
  if (!instance) {
    instance = supabase;
  }
  return instance;
}