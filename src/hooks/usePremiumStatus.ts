import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getClientIp } from '@/lib/search-limits/get-ip';
import { validateSearch } from '@/lib/search-limits/edge';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const checkInProgress = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        if (checkInProgress.current) {
          await checkInProgress.current;
          return;
        }

        const promise = (async () => {
        console.log("💎 Checking Premium status...");
        console.log("💎 validateSearch('check') from usePremiumStatus");

        const ip = await getClientIp();

        if (!ip) {
          console.warn('⚠️ No IP address found, cannot check Premium status.');
          setIsPremium(false);
          return;
        }

        const { data: supporter, error } = await supabase
          .from('supporters')
          .select('unlimited_searches')
          .eq('ip_address', ip)
          .eq('verified', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Supabase error when checking Premium:', error);
          setIsPremium(false);
          return;
        }

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

    return () => {
      checkInProgress.current = null;
    };
  }, []);

  return { isPremium, isLoading };
}
