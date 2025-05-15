import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Movie } from '@/types';
import { MovieSkeleton } from './skeleton';
import { MovieCard } from './movie-card';
import { PerfectMatchCard } from './perfect-match-card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumBadge } from '../ui/premium-badge';
import { PremiumModal } from '../ui/premium-modal';
import { USER_LIMITS } from '@/config';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { supabase } from '@/lib/supabaseClient';
import { PerfectMatchSection } from './perfect-match-section';

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
  isPerfectMatch: boolean;
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
  perfectMatch,
  isPerfectMatch
}: SearchResultsProps) {

  const [displayedResults, setDisplayedResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [localRemainingSearches, setLocalRemainingSearches] = useState<number | null>(null);

  useEffect(() => {
    if (typeof remainingSearches === 'number') {
      setLocalRemainingSearches(remainingSearches);
    }
  }, [remainingSearches]);

  const SearchCreditsSection = () => {
    if (isPremium) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto p-3 sm:p-6 rounded-lg text-center bg-gradient-to-r from-amber-500 to-amber-600 text-white"
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
            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
            >
              Get Unlimited Searches
            </Button>
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

  return (
    <div className="w-full">
      <div className={`sticky top-0 z-10 pb-3 sm:pb-4 ${isDark ? 'bg-[#040B14]/90' : 'bg-gray-50/90'} backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={onBack} className="hover:bg-transparent text-sm sm:text-base">
            ← Back to Search
          </Button>
        </div>

        <div>
          <h2 className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-blue-100' : 'text-gray-900'} flex items-center gap-2`}>
            Recommended for You
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
            {isPremium
              ? `${results.length} matches found based on your preferences`
              : `Here are ${results.length} great matches based on your preferences. Want more results and powerful discovery options? Become a Premium member for just $5 and unlock unlimited searches.`}
          </p>
        </div>
      </div>

      {isPerfectMatch && perfectMatch?.main && perfectMatch?.insights ? (
  <PerfectMatchSection
    movie={perfectMatch.main}
    insights={perfectMatch.insights}
    isDark={isDark}
  />
) : (
  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
    {!isInitialized ? (
      <div className="col-span-full text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className={isDark ? 'text-blue-200' : 'text-gray-600'}>
          Loading results...
        </p>
      </div>
    ) : displayedResults.map((movie) => (
      <MovieCard
        key={`movie-${movie.id}`}
        movie={movie}
        isDark={isDark}
      />
    ))}
  </div>
)}

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
  );
}
