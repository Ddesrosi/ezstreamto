import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Loader2 } from 'lucide-react';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

export default function PremiumSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'waiting' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    console.log('👋 PremiumSuccess.tsx is rendered');

    const checkPremiumDirectly = async () => {
      try {
        // Étape 1 — Identifier le UUID (priorité : URL > localStorage > fallback)
        const urlUUID = searchParams.get('uuid');
        const localStorageUUID = localStorage.getItem('visitor_id');
        const uuid = urlUUID || localStorageUUID || getOrCreateUUID();

  if (urlUUID && urlUUID !== localStorage.getItem('visitor_id')) {
  console.log('♻️ UUID in URL detected, storing and reloading:', urlUUID);
  localStorage.setItem('visitor_id', urlUUID);
  window.location.href = window.location.href; // recharge avec ?uuid= intact
  return;
}
      
        console.log('🔍 Checking Supabase for UUID:', uuid);

        // Étape 2 — Vérifier si ce UUID est Premium dans Supabase
        const { data, error } = await supabase
          .from('supporters')
          .select('visitor_uuid, verified')
          .eq('visitor_uuid', uuid)
          .eq('verified', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Supabase check error:', error.message);
          setStatus('error');
          return;
        }

        // Étape 3 — Statut Premium confirmé ✅
        if (data && data.verified) {
          console.log('✅ Premium confirmed via Supabase:', data);
          localStorage.setItem('isPremium', 'true');
          setStatus('success');
          console.log('✅ Premium status detected, redirecting in 2.5s');
          setTimeout(() => navigate('/'), 2500);
        } 
        // Étape 4 — Pas encore Premium, on attend et on réessaie
        else if (retryCount < maxRetries) {
          console.warn('⏳ Not yet verified – retrying...');
          setStatus('waiting');
          setRetryCount(prev => prev + 1);
          setTimeout(checkPremiumDirectly, 3000);
        } 
        // Étape 5 — Trop de tentatives, échec
        else {
          console.error('❌ Max retries reached without Premium confirmation.');
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        if (retryCount < maxRetries) {
          setTimeout(checkPremiumDirectly, 3000);
          setRetryCount(prev => prev + 1);
        } else {
          setStatus('error');
        }
      }
    };

    checkPremiumDirectly();
  }, [navigate, searchParams, retryCount]);

  console.log('👋 PremiumSuccess.tsx is rendered');

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
          {status === 'error' && "We couldn't verify your purchase. Please contact us."}
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
