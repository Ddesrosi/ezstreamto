import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

console.log('🔑 Initializing Supabase with:', { 
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    console.log("🔄 Creating new Supabase instance...");
    
    // Validate URL format
    try {
      new URL(SUPABASE_URL);
    } catch (error) {
      console.error("❌ Invalid Supabase URL format");
      throw new Error('Invalid Supabase URL format');
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': 'ezstreamto-web',
          'X-Client-Version': '1.0.0'
        }
      },
      db: {
        schema: 'public'
      }
    });
  } else {
    console.log("♻️ Reusing existing Supabase instance.");
  }
  return supabaseInstance;
}

// Create and export a single Supabase instance
export const supabase = getSupabaseClient();

// Test connection
(async () => {
  try {
    console.log("🔍 Testing Supabase connection...");
    
    // Test with a simple query to check connection
    const { data, error } = await supabase
      .from('ip_searches')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      console.error("❌ Supabase test failed:", error.message);
      console.error("Details:", error.details);
      console.error("Status:", error.code);
      
      // Check for specific error types
      if (error.code === 'PGRST301') {
        console.error("❌ Database connection error - check your database URL");
      } else if (error.code === '401') {
        console.error("❌ Authentication error - check your anon key");
      }
    } else {
      console.log("✅ Supabase connected successfully!");
      console.log("📊 Connection details:", {
        url: SUPABASE_URL,
        hasValidKey: !!SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("❌ Critical Supabase error:", err);
    if (err instanceof Error) {
      console.error("Stack:", err.stack);
    }
  }
})();