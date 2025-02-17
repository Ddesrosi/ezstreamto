import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://qmrtpqjngwvmukbfioga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnRwcWpuZ3d2bXVrYmZpb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NjgyNTMsImV4cCI6MjA1NDQ0NDI1M30.dOpevssQDtGMNMwi-onw3S4HWr5AOFIQKZB2o48yRlc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Node.js
console.log('🟢 Node.js is working!');
console.log('📦 Node.js version:', process.version);

// Test Supabase connection
async function testSupabase() {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase Error:', error.message);
      return;
    }
    
    console.log('✅ Supabase is connected!');
    console.log('📋 Sample data:', data);
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
  }
}

testSupabase();