import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// Validate environment variables
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runTests() {
  console.log('\n🔍 Search Limits Test Suite');
  console.log('=======================\n');

  // Test 1: IP Fetching
  try {
    console.log('📌 Test 1: IP Address Detection');
    console.log('------------------------------');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('✅ Successfully retrieved IP:', data.ip);
    console.log('');
  } catch (error) {
    console.error('❌ IP Detection Failed:', error.message);
    console.log('');
  }

  // Test 2: Database Connection
  try {
    console.log('📌 Test 2: Database Connectivity');
    console.log('------------------------------');
    const { data, error } = await supabase
      .from('ip_searches')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('✅ Successfully connected to database');
    console.log('');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error.message);
    console.log('');
  }

  // Test 3: Search Limits
  try {
    console.log('📌 Test 3: Search Limits Validation');
    console.log('--------------------------------');
    console.log('Running multiple searches to test limits...\n');
    
    for (let i = 1; i <= 6; i++) {
      const { data, error } = await supabase.functions.invoke('validate-search', {
        body: { ip: '127.0.0.1' }
      });

      if (error) throw error;

      const status = data.status === 'ok' ? '✅' : '❌';
      console.log(`Search ${i}:`, {
        status: `${status} ${data.status}`,
        remaining: data.remaining !== undefined ? data.remaining : 'N/A',
        message: data.message || 'No message'
      });
      
      // Add delay between requests to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');
  } catch (error) {
    console.error('❌ Search Limits Test Failed:', error.message);
    console.log('');
  }

  // Test 4: Support Verification
  try {
    console.log('📌 Test 4: Support Verification');
    console.log('----------------------------');
    const testTransactionId = 'test_transaction_123';
    const { data, error } = await supabase.functions.invoke('verify-support', {
      body: { 
        transaction_id: testTransactionId,
        ip_address: '127.0.0.1'
      }
    });

    if (error) throw error;
    console.log('✅ Support verification response:', data);
    console.log('');
  } catch (error) {
    console.error('❌ Support Verification Failed:', error.message);
    console.log('');
  }

  // Test 5: Database Records
  try {
    console.log('📌 Test 5: Database Records');
    console.log('------------------------');
    
    // Check IP searches
    const { data: searches, error: searchError } = await supabase
      .from('ip_searches')
      .select('*')
      .order('last_search', { ascending: false })
      .limit(3);
      
    if (searchError) throw searchError;
    console.log('Recent searches:', searches);

    // Check supporters
    const { data: supporters, error: supportError } = await supabase
      .from('supporters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (supportError) throw supportError;
    console.log('Recent supporters:', supporters);
    console.log('');
  } catch (error) {
    console.error('❌ Database Records Test Failed:', error.message);
    console.log('');
  }

  console.log('🏁 Test Suite Completed');
  console.log('====================\n');
}

// Run the test suite
console.log('🔑 Using Supabase URL:', process.env.VITE_SUPABASE_URL);
runTests().catch(error => {
  console.error('❌ Test Suite Failed:', error);
  process.exit(1);
});