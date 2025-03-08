import { supabase, getMockData } from './supabaseClient.js';

// Test Node.js
console.log('🟢 Node.js is working!');
console.log('📦 Node.js version:', process.version);

// Test data access
async function testDataAccess() {
  try {
    console.log('🔄 Testing data access...');
    
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ Data access working!');
    console.log('📋 Sample data:', data);
    
    // Show available mock data
    console.log('📚 Available mock data:', getMockData());
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Details:', err);
  }
}

testDataAccess();