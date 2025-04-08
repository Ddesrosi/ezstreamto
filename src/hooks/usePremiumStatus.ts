import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getClientIp } from '@/lib/search-limits/get-ip';
import { validateSearch } from '@/lib/search-limits/edge';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const checkPremiumStatus = async () => {
      try {
        console.log("💎 Checking Premium status...");
        console.log("💎 validateSearch('check') from usePremiumStatus");

        await validateSearch('check'); // Ne fait que checker, ne compte pas

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
      } catch (error) {
        console.error('❌ Error checking Premium status:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  return { isPremium, isLoading };
}
