import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getClientIp } from '@/lib/search-limits/get-ip';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';

const PREMIUM_CHECK_INTERVAL = 60000; // Check every minute

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const checkInProgress = useRef<Promise<void> | null>(null);
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        if (checkInProgress.current) {
          await checkInProgress.current;
          return;
        }

        const promise = (async () => {
          console.log("💎 Checking Premium status", new Date().toISOString());

          const ip = await getClientIp();
          const visitorId = getOrCreateUUID();

          if (!ip && !visitorId) {
            console.warn('⚠️ No IP or UUID found, cannot check Premium status.');
            setIsPremium(false);
            return;
          }

          const { data: supporter, error } = await supabase
  .from('supporters')
  .select('unlimited_searches, email, support_status, support_date')
  .or(`ip_address.eq.${ip},visitor_uuid.eq.${visitorId}`)
  .eq('verified', true)
  .maybeSingle();

          if (error) {
            console.error('❌ Supabase error when checking Premium:', error);
            setIsPremium(false);
            return;
          }

          console.log('✅ Premium check result:', {
            ...supporter,
            checkedAt: new Date().toISOString()
          });

          setIsPremium(!!supporter?.unlimited_searches);
        })();

        checkInProgress.current = promise;
        await promise;
        checkInProgress.current = null;
      } catch (error) {
        console.error('❌ Error checking Premium status:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();

    // Set up interval to check premium status
    checkInterval.current = window.setInterval(checkPremiumStatus, PREMIUM_CHECK_INTERVAL);

    return () => {
      checkInProgress.current = null;
      if (checkInterval.current) {
        window.clearInterval(checkInterval.current);
      }
    };
  }, []);

  return { isPremium, isLoading };
}
