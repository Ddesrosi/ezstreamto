import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        // Check if user has unlimited searches
        const { data: supporter } = await supabase
          .from('supporters')
          .select('unlimited_searches')
          .eq('verified', true)
          .single();

        setIsPremium(!!supporter?.unlimited_searches);
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  return { isPremium, isLoading };
}