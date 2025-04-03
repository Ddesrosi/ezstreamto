import { useState, useEffect } from 'react';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(true); // Set to true for testing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsPremium(true);
      setIsLoading(false);
    }, 500);
  }, []);

  return { isPremium, isLoading, error };
}