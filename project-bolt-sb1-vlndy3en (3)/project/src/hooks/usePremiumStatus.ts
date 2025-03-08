import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const isDev = import.meta.env.DEV;

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(isDev);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In development, always set premium status to true
    if (isDev) {
      setIsPremium(true);
      return;
    }

    // In production, check premium status from Supabase
    const checkPremiumStatus = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('premium_users')
            .select('is_active, expires_at')
            .eq('user_id', session.user.id)
            .single();

          if (error) throw error;

          const isActive = data?.is_active && 
            (!data.expires_at || new Date(data.expires_at) > new Date());
          
          setIsPremium(isActive);
        }
      } catch (err) {
        console.error('Failed to check premium status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check premium status');
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  return { isPremium, isLoading, error };
}