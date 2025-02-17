import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return { isPremium, isLoading, error };
}