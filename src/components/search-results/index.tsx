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
  console.log('🎬 SearchResults rendered:', {
    resultsCount: results?.length,
    remainingSearches,
    isPremium,
    hasPerfectMatch: !!perfectMatch,
    firstResult: results?.[0]
  });

  const [displayedResults, setDisplayedResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const SearchCreditsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full max-w-lg mx-auto p-3 sm:p-6 rounded-lg text-center",
        isDark 
          ? isPremium ? 'bg-blue-900/20 text-blue-200' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
          : isPremium ? 'bg-blue-50 text-blue-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {isPremium ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">Premium</span>
            </div>
            <p className="text-sm font-medium">
              Unlimited searches available
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium">
            {typeof localRemainingSearches !== 'number' ? (
              'Checking your available searches...'
            ) : localRemainingSearches === 1 ? (
              '1 free search remaining'
            ) : (
              `${localRemainingSearches} free searches remaining`
            )}
          </p>
        )}

      {!isPremium && (
      
  <button
  onClick={handlePremiumClick}
  className="flex items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-2 rounded-lg"
>
  <Coffee className="h-4 w-4 mr-1.5" />
  Get Unlimited Searches
</button>

)}

      </div>
    </motion.div>
  );

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
    setDisplayedResults([]);
    try {
      const initialBatch = results.slice(0, ITEMS_PER_BATCH);
      setDisplayedResults(initialBatch);
    } catch (error) {
      setLoadingError(error instanceof Error ? error.message : 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  }, [results]);

  const handlePremiumClick = async () => {
  try {
    const uuid = getOrCreateUUID();
    const { error } = await supabase
      .from('pre_payments')
      .insert([{ visitor_uuid: uuid }]);

    if (error) {
      console.error('❌ Error inserting pre_payment:', error);
    } else {
      console.log('✅ visitor_uuid inserted into pre_payments:', uuid);
    }

    window.location.href = `https://www.buymeacoffee.com/EzStreamTo?pre_payment_uuid=${uuid}&redirect_url=${encodeURIComponent(`https://ezstreamto.com/premium-success?uuid=${uuid}`)}`;
  } catch (error) {
    console.error('Error during premium upgrade:', error);
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
            Recommended for You
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
            {isPremium ? (
              `${results.length} matches found based on your preferences`
            ) : (
              `Here are ${results.length} great matches based on your preferences. Want more results and powerful discovery options? Become a Premium member for just $5 and unlock unlimited searches, exclusive filters, and AI-powered perfect matches!`
            )}
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {displayedResults.map((movie) => (
            <MovieCard 
              key={`movie-${movie.id}`}
              movie={movie} 
              isDark={isDark} 
            />
          ))}
        </div>
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
  );
}