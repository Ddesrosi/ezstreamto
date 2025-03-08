import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set to true for testing Premium features
    setIsPremium(true);
    setIsLoading(false);
  }, []);

  return { isPremium, isLoading, error };
}