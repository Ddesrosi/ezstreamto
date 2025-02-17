import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePremiumUpgrade() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgradeToPremium = async (transactionId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User must be logged in to upgrade');
      }

      const { data, error } = await supabase.functions.invoke('premium-upgrade', {
        body: {
          userId: session.user.id,
          transactionId,
          subscriptionType: 'monthly'
        }
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Premium upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process upgrade');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    upgradeToPremium,
    isProcessing,
    error
  };
}