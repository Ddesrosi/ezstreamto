import { supabase } from './lib/supabaseClient';

// Test Node.js
console.log('Node.js is working!');
console.log('Node.js version:', process.version);

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
    console.log('Sample data:', data);
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
  }
}

testSupabase();