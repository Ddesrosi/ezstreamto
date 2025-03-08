import { validateSearch, verifySupport } from './lib/search-limits';
import { supabase } from './lib/supabaseClient';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

async function runTests() {
  console.log('🧪 Starting Search Limits Tests...\n');

  try {
    // Validate environment first
    validateEnvironment();

    // Test 1: Basic Search Validation
    try {
      console.log('Test 1: Basic Search Validation');
      const result = await validateSearch();
      console.log('✅ Result:', result);
      console.log('Remaining searches:', result.remaining);
      console.log('');
    } catch (error) {
      console.error('❌ Test 1 Failed:', error);
    }

    // Test 2: Multiple Searches
    try {
      console.log('Test 2: Multiple Searches');
      console.log('Running 6 searches to test limit...');
      
      for (let i = 1; i <= 6; i++) {
        const result = await validateSearch();
        console.log(
          `Search ${i}:`,
          result.canSearch ? '✅ Allowed' : '❌ Blocked',
          result.remaining !== undefined ? `(${result.remaining} remaining)` : '',
          result.message || ''
        );
        // Add delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('');
    } catch (error) {
      console.error('❌ Test 2 Failed:', error);
    }

    // Test 3: Support Verification
    try {
      console.log('Test 3: Support Verification');
      const testTransactionId = 'test_transaction_123';
      const result = await verifySupport(testTransactionId);
      console.log('Support verification result:', result ? '✅ Verified' : '❌ Not Verified');
      console.log('');
    } catch (error) {
      console.error('❌ Test 3 Failed:', error);
    }

    // Test 4: Database Integration
    try {
      console.log('Test 4: Database Integration');
      
      // Check IP searches table
      const { data: searches, error: searchError } = await supabase
        .from('ip_searches')
        .select('*')
        .limit(5);
        
      if (searchError) throw searchError;
      console.log('✅ Recent searches:', searches);

      // Check supporters table
      const { data: supporters, error: supportError } = await supabase
        .from('supporters')
        .select('*')
        .limit(5);
        
      if (supportError) throw supportError;
      console.log('✅ Recent supporters:', supporters);
      console.log('');
    } catch (error) {
      console.error('❌ Test 4 Failed:', error);
    }
  } catch (error) {
    console.error('❌ Test Suite Failed:', error);
    process.exit(1);
  }

  console.log('🏁 Tests completed!\n');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal Error:', error);
  process.exit(1);
});