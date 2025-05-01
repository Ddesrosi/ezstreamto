import { useState, useEffect, useCallback, useRef } from 'react';
import { Film, Sun, Coffee, Zap, Heart, Brain, Compass, Clock, Search, Star, Tv2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { SearchModal } from '../ui/modal';
import { KeywordSelector } from '../ui/keyword-selector';
import { Movie } from '@/types';
import { getMovieRecommendations } from '@/lib/deepseek/index';
import { validateSearch } from '@/lib/search-limits/edge';
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
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { supabase } from '@/lib/supabaseClient';
import { PerfectMatch } from '../ui/perfect-match';

interface PreferenceFormProps {
  isDark: boolean;
  onSearch: (results: Movie[], remaining?: number, perfectMatch?: any) => void;
  onError: (message: string) => void;
  visitorUUID: string;
}

function PreferenceForm({ isDark, onSearch, onError, visitorUUID }: PreferenceFormProps) {
  // Content Type
  const [contentType, setContentType] = useState<'movie' | 'tv' | null>(null);
  const [hasLoadedSearchCredits, setHasLoadedSearchCredits] = useState(false);
  const loggedRef = useRef(false);
  
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
  useEffect(() => {
  if (remainingSearches !== null) {
    console.log("🧮 Remaining searches state:", remainingSearches);
  }
}, [remainingSearches]); // Ajout de remainingSearches comme dépendance pour réagir aux changements


  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const uuid = getOrCreateUUID();
  
  useEffect(() => {
  async function fetchInitialSearchCredits() {
    try {
      const result = await validateSearch('check', visitorUUID);
      console.log('📦 Initial search credits fetched:', result.remaining);
      setRemainingSearches(result.remaining);
    } catch (error) {
      console.error('❌ Failed to fetch initial search credits:', error);
    }
  }

  if (!hasLoadedSearchCredits) {
    fetchInitialSearchCredits();
    setHasLoadedSearchCredits(true);
  }
}, [hasLoadedSearchCredits]);

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
  const uuid = getOrCreateUUID();
  window.open(`https://www.buymeacoffee.com/EzStreamTo?pre_payment_uuid=${uuid}`, '_blank');
  setShowPremiumModal(false);
};
  
const handleSearch = useCallback(async () => {
  console.log("🧩 handleSearch() called – DEBUG LOG –", new Date().toISOString());

  console.log("🧪 handleSearch called");

  console.log('🔍 handleSearch triggered with:', {
    contentType,
    moods: selectedMoods.length,
    genres: selectedGenres.length,
    isPremium,
    isPerfectMatch: isPerfectMatchEnabled && isPremium
  });
  
  console.log("🔍 handleSearch triggered with preferences:", {
    contentType,
    moods: selectedMoods,
    genres: selectedGenres,
    keywords,
    yearRange,
    ratingRange,
    isPremium,
    isPerfectMatch: isPerfectMatchEnabled
  });

  let progressInterval: number | null = null;

  if (!contentType) {
    onError('Please select a content type first');
    return;
  }

  try {
    setIsSearching(true);
    setShowModal(true);
    setSearchProgress(0);

    // ✅ Vérifier les crédits sans consommer
    const result = await validateSearch("check", visitorUUID); // 👈 Ajoute cette ligne ici

    // Mise à jour du nombre de crédits restants avant la consommation
    setRemainingSearches(result.remaining);

    // Log avant la consommation pour vérifier les crédits restants
    console.log("📦 Remaining searches before consumption:", result.remaining);

    if (!result.canSearch) {
      setSearchLimitMessage(result.message || 'Search limit reached');
      setShowLimitToast(true);
      setShowPremiumModal(true);
      setIsSearching(false);
      setShowModal(false);
      return; // On arrête ici et on ne consomme pas de crédit.
    }

    // ✅ Lancer l'animation de progression
    progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 5;
      });
    }, 300);

    // 🔍 Récupération des résultats (Deepseek + TMDB)
    const response = await getMovieRecommendations({
      contentType,
      selectedMoods,
      selectedGenres,
      keywords: isPremium ? keywords : [],
      yearRange,
      specificYear: isPremium && specificYearInput ? parseInt(specificYearInput) : null,
      ratingRange,
      isPremium,
      isPerfectMatch: isPerfectMatchEnabled && isPremium
    });

    console.log('📥 Raw API response:', response);
    if (!response || !response.results) {
      throw new Error('Invalid response format from recommendation service');
    }

    const { results, perfectMatch } = response;
    console.log('🎬 Parsed results:', {
      count: results?.length,
      firstMovie: results?.[0],
      hasPerfectMatch: !!perfectMatch
    });

    if (!results || results.length === 0) {
      throw new Error('No results found. Please try different preferences.');
    }

       // ✅ Crédit consommé maintenant
    console.log("🧩 Before consuming search credit - remaining:", remainingSearches);  // Nouveau log avant la consommation

    setRemainingSearches(response.remaining);

    clearInterval(progressInterval);
    setSearchProgress(100);

    console.log('🚀 Calling onSearch with:', {
      resultsCount: results.length,
      remaining: response.remaining
    });

   await validateSearch("consume", visitorUUID);
console.log("🧾 Search credit consumed");

onSearch(results, response.remaining - 1, perfectMatch);
setShowResults(true);
    
// ✅ Consomme un crédit après une recherche réussie
await validateSearch("consume", visitorUUID);
console.log("🧾 Search credit consumed");

setIsSearching(false);
setShowModal(false);
setSearchProgress(0);

  } catch (error) {
    console.error('❌ Search error:', error);
    setIsSearching(false);
    setShowModal(false);
    clearInterval(progressInterval);
    setSearchProgress(0);
    const errorMessage = error instanceof Error ? error.message : 'Unable to get recommendations';
    onError(errorMessage);
  }
}, [
  contentType,
  selectedMoods,
  selectedGenres,
  keywords,
  yearRange,
  ratingRange,
  onSearch,
  onError,
  isPremium,
  specificYearInput,
  isPerfectMatchEnabled,
  remainingSearches
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
              {remainingSearches === null
                ? ''
                : remainingSearches === 1 
                  ? '1 free search remaining'
                  : `${remainingSearches} free searches remaining`}
            </p>
          )}
        </div>

      {!isPremium && (
  <div className="w-full sm:w-auto mt-4">
    <Button
      onClick={handlePremiumClick}
      size="md"
      className={cn(
        "w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 font-medium",
        "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white",
        "rounded-lg transition-all duration-300 hover:scale-105"
      )}
    >
      Get Unlimited Searches
    </Button>
  </div>
)}

      </div>
    </motion.div>
  );

  const handlePremiumClick = async () => {
  try {
    const uuid = getOrCreateUUID();

    // 🔵 1. Insérer dans pre_payments
    const { error } = await supabase
      .from('pre_payments')
      .insert([{ visitor_uuid: uuid }]);

    if (error) {
      console.error('❌ Error inserting pre_payment:', error);
      return; // Si erreur, on stoppe ici
    }

    console.log('✅ visitor_uuid inserted into pre_payments:', uuid);

    // 🔵 2. Rediriger seulement après succès de l'insertion
    window.location.href = `https://www.buymeacoffee.com/EzStreamTo?pre_payment_uuid=${uuid}`;
  } catch (error) {
    console.error('❌ Unexpected error during premium upgrade:', error);
  }
};

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
                  setShowPremiumModal(true);
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
              onClick={() => {
                console.log('🟩 Search button clicked — TIMESTAMP:', new Date().toISOString());
                handleSearch();
              }}
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