import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Loader2 } from 'lucide-react';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { validateSearch } from '@/lib/search-limits/edge';
import { cn } from '@/lib/utils';

export default function PremiumSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'waiting'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    const checkPremium = async () => {
      try {
        // Get UUID from URL or localStorage
        const urlUUID = searchParams.get('uuid');
        const localStorageUUID = localStorage.getItem('visitor_id');
        const uuid = urlUUID || localStorageUUID || getOrCreateUUID();

        // Store UUID if from URL
        if (urlUUID) {
          localStorage.setItem('visitor_id', uuid);
          console.log('✅ Stored UUID:', uuid);
        }

        // Check Premium status
        const result = await validateSearch('check');
        console.log('🔍 Premium check result:', result);

        if (result.isPremium || result.canSearch) {
          setStatus('success');
          localStorage.setItem('isPremium', 'true');
          setTimeout(() => navigate('/'), 2000);
        } else if (retryCount < maxRetries) {
          setStatus('waiting');
          setRetryCount(prev => prev + 1);
          setTimeout(checkPremium, 3000);
        }
      } catch (error) {
        console.error('❌ Premium check error:', error);
        if (retryCount < maxRetries) {
          setTimeout(checkPremium, 3000);
          setRetryCount(prev => prev + 1);
        }
      }
    };

    checkPremium();
  }, [navigate, searchParams, retryCount]);

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
        </h1>

        <p className={cn(
          "text-lg",
          status === 'success' ? 'text-green-200' : 'text-blue-100'
        )}>
          {status === 'checking' && 'Please wait while we verify your payment...'}
          {status === 'waiting' && "We are processing your purchase. This may take a few moments..."}
          {status === 'success' && 'Redirecting you to your Premium experience...'}
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