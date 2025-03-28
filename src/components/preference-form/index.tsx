import { useState, useEffect, useCallback } from 'react';
import { Film, Sun, Coffee, Zap, Heart, Brain, Compass, Clock, Search, Star, Tv2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { SearchModal } from '../ui/modal';
import { KeywordSelector } from '../ui/keyword-selector';
import { Movie } from '@/types';
import { getMovieRecommendations } from '@/lib/deepseek/index';
import { validateSearch } from '@/lib/search-limits';
import { cn } from '@/lib/utils';
import { 
  moods, genres, durations, streamingServices, audiences, 
  timePresets, ratingPresets 
} from '@/lib/constants/form';
import { Tooltip } from '../ui/tooltip';
import { Toast } from '../ui/toast';
import { PremiumBadge } from '../ui/premium-badge';
import { PremiumModal } from '../ui/premium-modal';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { PremiumFeatureWrapper } from '../ui/premium-feature-wrapper';
import { PerfectMatch } from '../ui/perfect-match';

interface PreferenceFormProps {
  isDark: boolean;
  onSearch: (results: Movie[], remaining?: number, perfectMatch?: any) => void;
  onError: (message: string) => void;
}

function PreferenceForm({ isDark, onSearch, onError }: PreferenceFormProps) {
  // Content Type
  const [contentType, setContentType] = useState<'movie' | 'tv' | null>(null);
  
  // Preferences
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  // Keywords state and handlers
  const [keywords, setKeywords] = useState<string[]>([]);

  // Rating Range
  const [ratingRange, setRatingRange] = useState({ min: 0, max: 10 });
  const [activeRatingPreset, setActiveRatingPreset] = useState<string | null>('Any Rating');

  // UI State
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [searchLimitMessage, setSearchLimitMessage] = useState('');
  const [remainingSearches, setRemainingSearches] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();

  // Perfect Match
  const [isPerfectMatchEnabled, setIsPerfectMatchEnabled] = useState(false);

  // Form progression states
  const canSelectMood = contentType !== null;
  const canSelectGenres = canSelectMood && selectedMoods.length > 0;
  const canSelectOptionals = canSelectGenres && selectedGenres.length > 0;

  // Year Range
  const [yearRange, setYearRange] = useState({ from: 1920, to: new Date().getFullYear() });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [specificYearInput, setSpecificYearInput] = useState('');
  const [sliderValue, setSliderValue] = useState<[number, number]>([1920, new Date().getFullYear()]);

  const handleKeywordSelect = (keyword: string) => {
    setKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleSpecificYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d{0,4}$/.test(value)) {
      setSpecificYearInput(value);
      if (value.length === 4) {
        const year = parseInt(value);
        if (year >= 1920 && year <= new Date().getFullYear()) {
          setYearRange({ from: year, to: year });
          setSliderValue([year, year]);
          setActivePreset(null);
        }
      }
    }
  };

  const handlePresetClick = (preset: { label: string; range: { from: number; to: number } }) => {
    setActivePreset(preset.label);
    setYearRange(preset.range);
    setSliderValue([preset.range.from, preset.range.to]);
    setSpecificYearInput('');
  };

  const handleUpgrade = () => {
    window.open('https://www.buymeacoffee.com/EzStreamTo', '_blank');
    setShowPremiumModal(false);
  };

  // Check search limits on component mount
  useEffect(() => {
    async function checkSearchLimits() {
      try {
        const searchValidation = await validateSearch();
        if (searchValidation.remaining !== undefined) {
          setRemainingSearches(searchValidation.remaining);
        }
      } catch (error) {
        console.error('Failed to check search limits:', error);
      }
    }
    checkSearchLimits();
  }, []);

  const handleSearch = useCallback(async () => {
    console.log('🔍 Starting search with preferences:', {
      contentType,
      moods: selectedMoods,
      genres: selectedGenres,
      isPremium
    });

    if (!contentType) {
      onError('Please select a content type first');
      return;
    }

    if (selectedMoods.length === 0) {
      onError('Please select at least one mood');
      return;
    }

    if (selectedGenres.length === 0) {
      onError('Please select at least one genre');
      return;
    }

    // Validate Premium-only features
    if (!isPremium) {
      if (keywords.length > 0) {
        onError('Keywords are a Premium feature');
        return;
      }
      if (isPerfectMatchEnabled) {
        onError('Perfect Match is a Premium feature');
        return;
      }
      if (specificYearInput) {
        onError('Specific year selection is a Premium feature');
        return;
      }
      if (ratingRange.min > 0 || ratingRange.max < 10) {
        onError('Custom rating ranges are a Premium feature');
        return;
      }
    }

    try {
      setIsSearching(true);
      setShowModal(true);
      setSearchProgress(0);

      const searchValidation = await validateSearch();
      
      if (!searchValidation.canSearch) {
        setSearchLimitMessage(searchValidation.message || 'Search limit reached');
        setShowLimitToast(true);
        setShowPremiumModal(true);
        setIsSearching(false);
        setShowModal(false);
        return;
      }

      if (searchValidation.remaining !== undefined) {
        setRemainingSearches(searchValidation.remaining);
      }

      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          const increment = prev < 30 ? 2 : prev < 60 ? 4 : 3;
          return prev + Math.random() * increment;
        });
      }, 400);

      console.log('🔍 Starting search with preferences:', {
        contentType,
        selectedMoods,
        selectedGenres,
        yearRange,
        ratingRange
      });

      const response = await getMovieRecommendations({
        contentType,
        selectedMoods,
        selectedGenres,
        keywords: isPremium ? keywords : [],
        yearRange,
        specificYear: isPremium && specificYearInput ? parseInt(specificYearInput) : null,
        ratingRange,
        isPremium,
        isPerfectMatch: isPerfectMatchEnabled && isPremium,
        isPerfectMatchEnabled: isPerfectMatchEnabled && isPremium
      });

      const { results } = response;

      console.log('✅ Search results:', {
        resultsCount: results.length,
        firstMovie: results[0]?.title,
        remainingSearches: searchValidation.remaining
      });

      clearInterval(progressInterval);
      setSearchProgress(100);
      
      setTimeout(() => {
        onSearch(results, searchValidation.remaining);
        setIsSearching(false);
        setShowModal(false);
        setSearchProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setShowModal(false);
      setSearchProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Unable to get recommendations';
      console.error('❌ Search failed:', errorMessage);
      onError(errorMessage);
    }
  }, [
    contentType, selectedMoods, selectedGenres,
    keywords, yearRange, 
    ratingRange, onSearch, onError, isPremium, specificYearInput,
    isPerfectMatchEnabled
  ]);

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          {isPremium ? (
            <div className="flex items-center gap-2">
              <PremiumBadge />
              <p className="text-xs sm:text-sm font-medium">
                Unlimited searches
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
          <div className="w-full sm:w-auto">
            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Get Unlimited Searches
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      <SearchModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        progress={searchProgress}
      />
      
      <Toast
        message={searchLimitMessage}
        isVisible={showLimitToast}
        onClose={() => setShowLimitToast(false)}
      />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4">
        {/* Search Credits Display - Top */}
        <div className="mb-6 sm:mb-8">
          <SearchCreditsSection />
        </div>

        <div className="space-y-3 sm:space-y-6">
          {/* Content Type Selection */}
          <div className={`p-3 sm:p-6 rounded-lg border ${isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Tooltip content="Looking for a movie or TV series? Let's start here!">
                <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                  Content Type
                </h3>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Button
                variant={contentType === 'movie' ? 'primary' : 'secondary'}
                onClick={() => setContentType('movie')}
                className="flex items-center justify-center gap-2 h-10 sm:h-12 text-sm sm:text-base"
              >
                <Film className="h-4 w-4" />
                <span>Movies</span>
              </Button>
              <Button
                variant={contentType === 'tv' ? 'primary' : 'secondary'}
                onClick={() => setContentType('tv')}
                className="flex items-center justify-center gap-2 h-10 sm:h-12 text-sm sm:text-base"
              >
                <Tv2 className="h-4 w-4" />
                <span>TV Series</span>
              </Button>
            </div>
          </div>

          {/* Moods Section */}
          <div className={cn(
            `p-3 sm:p-6 rounded-lg border transition-all duration-300`,
            isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200',
            !canSelectMood && 'opacity-50 pointer-events-none'
          )}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Tooltip content="What's your mood today? This helps us find the perfect match!">
                <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                  Mood
                </h3>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
              {moods.map(({ name, icon: Icon, tooltip }) => (
                <Tooltip key={name} content={tooltip}>
                  <Button
                    variant={selectedMoods.includes(name) ? 'primary' : 'secondary'}
                    onClick={() => setSelectedMoods(prev => 
                      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
                    )}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 w-full h-10 sm:h-12 text-xs sm:text-sm"
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="whitespace-nowrap">{name}</span>
                  </Button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Genres Section */}
          <div className={cn(
            `p-3 sm:p-6 rounded-lg border transition-all duration-300`,
            isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200',
            !canSelectGenres && 'opacity-50 pointer-events-none'
          )}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Tooltip content="Pick your favorite genres to narrow down the search">
                <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                  Genres
                </h3>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
              {genres.map(({ name, icon: Icon }) => (
                <Button
                  key={name}
                  variant={selectedGenres.includes(name) ? 'primary' : 'secondary'}
                  onClick={() => setSelectedGenres(prev => 
                    prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
                  )}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 text-xs sm:text-sm"
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Optional Sections */}
          <div className={cn(
            'space-y-3 sm:space-y-6 transition-all duration-300',
            !canSelectOptionals && 'opacity-50 pointer-events-none'
          )}>
            {/* Keywords Section - Premium Feature */}
            <PremiumFeatureWrapper
              isPremium={isPremium}
              isLoading={isPremiumLoading}
              onPremiumClick={() => setShowPremiumModal(true)}
              title="Keywords"
              className={`p-3 sm:p-6 rounded-lg border ${isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                  Keywords
                </h3>
              </div>
              <KeywordSelector
                isPremium={isPremium}
                onPremiumClick={() => setShowPremiumModal(true)}
                selectedKeywords={keywords}
                onKeywordSelect={handleKeywordSelect}
                isDark={isDark}
              />
            </PremiumFeatureWrapper>

            {/* Perfect Match */}
            <PerfectMatch
              isPremium={isPremium}
              isEnabled={isPerfectMatchEnabled}
              onToggle={(enabled: boolean) => {
                if (!isPremium) {
                  onPremiumClick();
                  return;
                }
                setIsPerfectMatchEnabled(enabled);
              }}
              onUpgrade={() => setShowPremiumModal(true)}
              isDark={isDark}
            />

            {/* Specific Year Input - Premium Feature */}
            <PremiumFeatureWrapper
              isPremium={isPremium}
              isLoading={isPremiumLoading}
              onPremiumClick={() => setShowPremiumModal(true)}
              title="Specific Year"
              className={`p-3 sm:p-6 rounded-lg border ${isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                  Specific Year
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
                  Enter a specific year
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={specificYearInput}
                  onChange={handleSpecificYearChange}
                  placeholder="YYYY"
                  className={`w-16 px-2 py-1 rounded-md border text-center ${
                    isDark 
                      ? 'bg-[#0A1A3F] border-blue-900/30 text-blue-100 placeholder-blue-400/50'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>
            </PremiumFeatureWrapper>

            {/* Time Period Selection - Standard Feature */}
            <div className={`p-3 sm:p-6 rounded-lg border ${isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Tooltip content="Select a time period for your content">
                  <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                    Time Period
                  </h3>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timePresets.map(preset => (
                  <Button
                    key={preset.label}
                    variant={activePreset === preset.label ? 'primary' : 'secondary'}
                    onClick={() => {
                      if (activePreset === preset.label) {
                        // Reset to default if clicking the active preset
                        setActivePreset(null);
                        setYearRange({ from: 1920, to: new Date().getFullYear() });
                        setSliderValue([1920, new Date().getFullYear()]);
                      } else {
                        handlePresetClick(preset);
                      }
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <preset.icon className="h-4 w-4" />
                    <span className="text-sm">{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Rating Range Section - Premium Feature */}
            <PremiumFeatureWrapper
              isPremium={isPremium}
              isLoading={isPremiumLoading}
              onPremiumClick={() => setShowPremiumModal(true)}
              title="Rating Range"
              className={`p-3 sm:p-6 rounded-lg border ${isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Tooltip content="Select your preferred rating range">
                  <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                    Rating Range
                  </h3>
                </Tooltip>
              </div>
              
              {/* Single Rating Range Slider */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={ratingRange.min}
                      onChange={(e) => setRatingRange(prev => ({ ...prev, min: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>
                      {ratingRange.min.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Rating Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ratingPresets.map(preset => (
                    <Button
                      key={preset.label}
                      variant={activeRatingPreset === preset.label ? 'primary' : 'secondary'}
                      onClick={() => {
                        setActiveRatingPreset(preset.label);
                        setRatingRange(preset.range);
                      }}
                      className="flex items-center justify-center gap-2"
                    >
                      <preset.icon className="h-4 w-4" />
                      <span className="text-sm">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </PremiumFeatureWrapper>

            {/* Find Matches Button */}
            <Button 
              size="lg" 
              className="w-full h-12 sm:h-14 text-base sm:text-lg transition-all duration-300 mt-6"
              onClick={handleSearch}
              disabled={isSearching || !contentType || selectedMoods.length === 0 || selectedGenres.length === 0}
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Finding Matches...</span>
                </div>
              ) : (
                <span>Find What to Watch</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PreferenceForm;