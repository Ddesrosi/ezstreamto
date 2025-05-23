import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Loader2 } from 'lucide-react';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

export default function PremiumSuccess() {
  console.log('👋 PremiumSuccess.tsx is rendered');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'waiting' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds between retries

  useEffect(() => {
    const checkPremiumDirectly = async () => {
      try {
        const urlUUID = searchParams.get('uuid');
        const localStorageUUID = localStorage.getItem('visitor_id');
        const uuid = urlUUID || localStorageUUID || getOrCreateUUID();

        console.log('🧾 UUIDs:', { urlUUID, localStorageUUID, resolved: uuid });

        if (urlUUID && urlUUID !== localStorage.getItem('visitor_id')) {
          console.log('♻️ UUID in URL detected, storing and reloading:', urlUUID);
          localStorage.setItem('visitor_id', urlUUID);
          
          // Remove uuid from URL but keep other params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('uuid');
          window.history.replaceState({}, '', newUrl.toString());
          
          window.location.reload();
          return;
        }

        console.log('🔍 Checking Supabase for UUID:', uuid);

        const { data, error } = await supabase
          .from('supporters')
          .select('visitor_uuid, verified, unlimited_searches')
          .eq('visitor_uuid', uuid)
          .eq('verified', true)
          .maybeSingle();

        console.log('📦 Supabase returned (raw):', { data, error });

        if (error) {
          console.error('❌ Supabase check error:', error.message);
          setStatus('error');
          return;
        }

        console.log('🔎 Full Supabase response:', data);

        if (data && data.verified === true) {
          console.log('✅ Premium confirmed via Supabase:', data);
          localStorage.setItem('isPremium', 'true');
          setStatus('success');

          console.log('⏳ Waiting 2.5s before navigating to homepage');
          setTimeout(() => {
            console.log('🚀 Navigating to homepage now');
            navigate('/');
          }, 2500);
        } else if (retryCount < maxRetries) {
          console.warn('⏳ Not yet verified – retrying...');
          setStatus('waiting');
          setRetryCount(prev => prev + 1);
          setTimeout(checkPremiumDirectly, retryDelay);
        } else {
          console.error('❌ Max retries reached without Premium confirmation.');
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        if (retryCount < maxRetries) {
          setTimeout(checkPremiumDirectly, retryDelay);
          setRetryCount(prev => prev + 1);
        } else {
          setStatus('error');
        }
      }
    };

    checkPremiumDirectly();
  }, [navigate, searchParams, retryCount]);

  console.log('🟦 JSX is now rendering for PremiumSuccess');

  return (
    <div className="min-h-screen bg-[#040B14] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gradient-to-b from-blue-600 to-blue-700 rounded-xl p-6 text-center shadow-2xl"
      >
        <div className="mb-6">
          {status === 'checking' && (
            <Loader2 className="w-12 h-12 text-white mx-auto animate-spin" />
          )}
          {status === 'waiting' && (
            <Coffee className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 bg-green-500 rounded-full mx-auto flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          {status === 'checking' && 'Validating Your Purchase'}
          {status === 'waiting' && 'Almost There!'}
          {status === 'success' && 'Premium Access Granted!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className={cn(
          "text-lg",
          status === 'success' ? 'text-green-200' :
          status === 'error' ? 'text-red-200' :
          'text-blue-100'
        )}>
          {status === 'checking' && 'Please wait while we verify your payment...'}
          {status === 'waiting' && "We are processing your purchase. This may take a few moments..."}
          {status === 'success' && 'Redirecting you to your Premium experience...'}
         {status === 'error' && (
  <>
    We received your support, but it may not meet the $5 minimum for Premium access. <br />
    If this is a mistake, please contact us.
  </>
)}
        </p>

        {status === 'waiting' && retryCount > 0 && (
          <p className="text-sm text-blue-200/70 mt-4">
            Still processing... Attempt {retryCount} of {maxRetries}
          </p>
        )}
      </motion.div>
    </div>
  );
}
