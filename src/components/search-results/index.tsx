import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Movie } from '@/types';
import { MovieSkeleton } from './skeleton';
import { MovieCard } from './movie-card';
import { motion } from 'framer-motion';
import { Sparkles, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumBadge } from '../ui/premium-badge';
import { PremiumModal } from '../ui/premium-modal';
import { PerfectMatchCard } from './perfect-match-card';
import type { PerfectMatchInsights } from '@/lib/perfect-match';
import { USER_LIMITS } from '@/config';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { supabase } from '@/lib/supabaseClient';

interface SearchResultsProps {
  results: Movie[];
  isDark: boolean;
  onBack: () => void;
  remainingSearches: number | null;
  isPremium: boolean;
  isPremiumLoading: boolean;
  setShowPremiumModal: (show: boolean) => void;
  perfectMatch?: {
    movie: Movie;
    insights: PerfectMatchInsights;
  };
}

const ITEMS_PER_BATCH = 12;

export default function SearchResults({ 
  results, 
  isDark, 
  onBack, 
  remainingSearches, 
  isPremium, 
  isPremiumLoading, 
  setShowPremiumModal,
  perfectMatch 
}: SearchResultsProps) {
  
  const [displayedResults, setDisplayedResults] = useState<Movie[]>([]);

  console.log('📊 SearchResults component:', {
    resultsCount: results?.length,
    remainingSearches,
    isPremium,
    hasPerfectMatch: !!perfectMatch,
    firstResult: results?.[0],
    displayedResults: displayedResults?.length
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLocalPremiumModal, setShowLocalPremiumModal] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const uuid = getOrCreateUUID();

  const [localRemainingSearches, setLocalRemainingSearches] = useState<number | null>(null);

  useEffect(() => {
    if (typeof remainingSearches === 'number') {
      setLocalRemainingSearches(remainingSearches);
    }
  }, [remainingSearches]);

  const handleUpgrade = () => {
    const uuid = getOrCreateUUID();
    window.open(`https://www.buymeacoffee.com/EzStreamTo?pre_payment_uuid=${uuid}`, '_blank');
    setShowLocalPremiumModal(false);
  };

 const SearchCreditsSection = () => {
  if (isPremium) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full max-w-lg mx-auto p-3 sm:p-6 rounded-lg text-center",
        isDark 
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 w-full">
        <p className="text-xs sm:text-sm font-medium">
          {typeof localRemainingSearches !== 'number' ? (
            'Checking your available searches...'
          ) : localRemainingSearches === 1 ? (
            '1 free search remaining'
          ) : (
            `${localRemainingSearches} free searches remaining`
          )}
        </p>

        <div className="w-full sm:w-auto">
          <button
            onClick={handlePremiumClick}
            type="button"
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300"
          >
            Get Unlimited Searches
          </button>
        </div>
      </div>
    </motion.div>
  );
};

  const handleLoadMore = () => {
    setIsLoading(true);
    const nextBatch = results.slice(
      displayedResults.length,
      displayedResults.length + ITEMS_PER_BATCH
    ).filter(movie => !displayedResults.some(m => m.id === movie.id));

    setDisplayedResults(prev => [...prev, ...nextBatch]);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setLoadingError(null);
    setIsInitialized(false);
    
    try {
      const initialBatch = results.slice(0, ITEMS_PER_BATCH);
      console.log('🎯 Setting initial batch:', {
        batchSize: ITEMS_PER_BATCH,
        resultCount: initialBatch.length,
        firstResult: initialBatch[0]
      });
      setIsInitialized(true);
      setDisplayedResults(initialBatch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load results';
      console.error('❌ Error loading results:', errorMessage);
      setLoadingError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [results]);

  const handlePremiumClick = async () => {
    try {
      const uuid = getOrCreateUUID();
      console.log('🔵 Handling premium click with UUID:', uuid);

      const { error } = await supabase
        .from('pre_payments')
        .insert([{ visitor_uuid: uuid }]);

      if (error) {
        console.error('❌ Error inserting pre_payment:', error);
        return;
      }

      console.log('✅ visitor_uuid inserted into pre_payments:', uuid);

      window.location.href = `https://www.buymeacoffee.com/EzStreamTo?pre_payment_uuid=${uuid}`;
    } catch (error) {
      console.error('❌ Unexpected error during premium upgrade:', error);
    }
  };

  return (
    <div className="w-full">
      <PremiumModal 
        isOpen={showLocalPremiumModal}
        onClose={() => setShowLocalPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />

      <div className={`sticky top-0 z-10 pb-3 sm:pb-4 ${isDark ? 'bg-[#040B14]/90' : 'bg-gray-50/90'} backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={onBack} className="hover:bg-transparent text-sm sm:text-base">
            ← Back to Search
          </Button>
        </div>
        <div>

          <h2 className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-blue-100' : 'text-gray-900'} flex items-center gap-2`}>
  {perfectMatch ? '🎯 Your Perfect Match' : 'Recommended for You'}
</h2>

<p className={`text-xs sm:text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
  {perfectMatch ? (
    'Based on your preferences, we’ve selected one perfect match and 3 similar suggestions.'
  ) : isPremium ? (
    `${results.length} matches found based on your preferences`
  ) : (
    `Here are ${results.length} great matches based on your preferences. Want more results and powerful discovery options? Become a Premium member for just $5 and unlock unlimited searches, exclusive filters, and AI-powered perfect matches!`
  )}
</p>

        </div>
      </div>
      
console.log("📊 perfectMatch received:", perfectMatch);
console.log("🎬 movie details:", perfectMatch?.movie);
     
      {perfectMatch ? (
        <div className="my-8 w-full">
         <PerfectMatchCard
  movie={perfectMatch.main}
  insights={perfectMatch.insights}
  isDark={isDark}
/>

        </div>
      ) : (
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {!isInitialized ? (
              <div className="col-span-full text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className={isDark ? 'text-blue-200' : 'text-gray-600'}>Loading results...</p>
              </div>
            ) : displayedResults.map((movie) => (
              <MovieCard
                key={`movie-${movie.id}`}
                movie={movie}
                isDark={isDark}
              />
            ))}
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mt-4 mb-6">
              <MovieSkeleton 
                count={Math.min(ITEMS_PER_BATCH, results.length - displayedResults.length)} 
                isDark={isDark} 
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-6 sm:gap-8 py-6 sm:py-8 mb-6">
            {!isLoading && displayedResults.length < results.length && (
              <Button
                onClick={handleLoadMore}
                className="w-full sm:w-auto h-10 sm:h-12 text-sm sm:text-base"
              >
                Load More
              </Button>
            )}

            <div className="w-full">
              <SearchCreditsSection />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
