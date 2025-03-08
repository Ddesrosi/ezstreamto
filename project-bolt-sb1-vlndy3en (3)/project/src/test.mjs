import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://acmpivmrokzblypxdxbu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbXBpdm1yb2t6Ymx5cHhkeGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NDE1OTUsImV4cCI6MjA1NDUxNzU5NX0.nPs1MeO2vH7bh85tvLrH5-jFBCPk9Z1kQMGuZGKmY3s';

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