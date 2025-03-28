import { useState, useEffect } from 'react';


export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always return basic status
  useEffect(() => setIsLoading(false), []);

  return { isPremium, isLoading, error };
}