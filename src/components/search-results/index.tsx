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
  const [isLoading, setIsLoading] = useState(true);
  const [showLocalPremiumModal, setShowLocalPremiumModal] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Early return for perfect match view
  if (perfectMatch) {
    console.log('🎯 Rendering Perfect Match view:', {
      movie: perfectMatch.movie.title,
      hasInsights: !!perfectMatch.insights,
      recommendationsCount: perfectMatch.insights?.recommendations?.length
    });

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
              <Sparkles className="h-5 w-5 text-amber-400" />
              Perfect Match: {perfectMatch.movie.title}
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
              AI-powered recommendation based on your preferences
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-6">
          <PerfectMatchCard
            movie={perfectMatch.movie}
            insights={perfectMatch.insights}
            isDark={isDark}
          />
        </div>
      </div>
    );
  }

  // Early return for no results
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <div className="w-full text-center py-8 sm:py-12">
        <p className={`text-base sm:text-lg ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>
          No results found. Please try different preferences.
        </p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          ← Back to Search
        </Button>
      </div>
    );
  }

  useEffect(() => {
    setIsLoading(true);
    setLoadingError(null);
    setDisplayedResults([]);

    try {
      const initialBatch = results.slice(0, ITEMS_PER_BATCH);
      setDisplayedResults(initialBatch);
    } catch (error) {
      console.error('Error loading results:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  }, [results, perfectMatch, isPremium]);

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || perfectMatch) return;

      const isNearBottom = 
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 200;

      if (isNearBottom && displayedResults.length < results.length) {
        setIsLoading(true);
        const nextBatch = results.slice(
          displayedResults.length,
          displayedResults.length + ITEMS_PER_BATCH
        );

        console.log('➕ Adding batch:', {
          size: nextBatch.length,
          movies: nextBatch.map(m => ({
            title: m.title,
            platforms: m.streamingPlatforms,
            hasTrailer: !!m.youtubeUrl
          }))
        });
        setDisplayedResults(prev => [...prev, ...nextBatch]);
        setIsLoading(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedResults.length, isLoading, results, perfectMatch]);

  const handleLoadMore = () => {
    setIsLoading(true);
    const nextBatch = results.slice(
      displayedResults.length,
      displayedResults.length + ITEMS_PER_BATCH
    ).filter(movie => !displayedResults.some(m => m.id === movie.id));
    
    setDisplayedResults(prev => [...prev, ...nextBatch]);
    setIsLoading(false);
  };

  const handleUpgrade = () => {
    window.open('https://www.buymeacoffee.com/EzStreamTo', '_blank');
    setShowLocalPremiumModal(false);
  };

  const SearchCreditsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full max-w-lg mx-auto p-3 sm:p-6 rounded-lg text-center transition-all duration-300",
        isDark 
          ? isPremium ? 'bg-blue-900/20 text-blue-200' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
          : isPremium ? 'bg-blue-50 text-blue-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isPremium ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">Premium</span>
            </div>
            <p className="text-xs sm:text-sm font-medium">
              Unlimited searches available
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-medium">
            {remainingSearches === 1 
              ? '1 free search remaining'
              : `${remainingSearches} free searches remaining`}
          </p>
        )}
      </div>

      {!isPremium && (
        <div className="flex justify-center mt-3 sm:mt-4">
          <Button
            onClick={() => setShowLocalPremiumModal(true)}
            className="text-sm sm:text-base h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Coffee className="h-4 w-4 mr-1.5" />
            Get Unlimited Searches
          </Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="w-full">
      {/* Premium Modal */}
      <PremiumModal />

      {/* Header with Back Button */}
      <div className={`sticky top-0 z-10 pb-3 sm:pb-4 ${isDark ? 'bg-[#040B14]/90' : 'bg-gray-50/90'} backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={onBack} className="hover:bg-transparent text-sm sm:text-base">
            ← Back to Search
          </Button>
        </div>
        <div>
          <h2 className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-blue-100' : 'text-gray-900'} flex items-center gap-2`}>
            {perfectMatch && (
              <Sparkles className="h-5 w-5 text-amber-400" />
            )}
            {perfectMatch ? 'Your Perfect Match' : 'Recommended for You'}
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
            {perfectMatch ? (
              'AI-powered recommendation based on your preferences'
            ) : isPremium ? (
              `${results.length} matches found based on your preferences`
            ) : (
              `Here are ${results.length} great matches based on your preferences. Want more results and powerful discovery options? Become a Premium member for just $5 and unlock unlimited searches, exclusive filters, and AI-powered perfect matches!`
            )}
          </p>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-6 mb-6">
        {perfectMatch && perfectMatch.movie ? (
          // Perfect Match View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`perfect-match-${perfectMatch.movie.id}`}
          >
            <PerfectMatchCard
              movie={perfectMatch.movie}
              insights={perfectMatch.insights}
              isDark={isDark}
            />
          </motion.div>
        ) : (
          // Regular Results Grid
          displayedResults.length > 0 && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
              {displayedResults.map((movie) => (
                <MovieCard 
                  key={`movie-${movie.id}`}
                  movie={movie} 
                  isDark={isDark} 
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Loading State */}
      {isLoading && !perfectMatch && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mt-4 mb-6">
          <MovieSkeleton 
            count={Math.min(ITEMS_PER_BATCH, results.length - displayedResults.length)} 
            isDark={isDark} 
          />
        </div>
      )}

      {/* Support Section */}
      <div className="flex flex-col items-center gap-6 sm:gap-8 py-6 sm:py-8 mb-6">
        {/* Load More Button */}
        {!isLoading && !perfectMatch && displayedResults.length < results.length && (
          <Button
            onClick={handleLoadMore}
            className="w-full sm:w-auto h-10 sm:h-12 text-sm sm:text-base"
          >
            Load More
          </Button>
        )}

        {/* Search Credits - Bottom */}
        <SearchCreditsSection />
      </div>
    </div>
  );
}