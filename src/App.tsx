import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Header } from './components/layout/header';
import PreferenceForm from './components/preference-form';
import SearchResults from './components/search-results';
import { TrendingCarousel } from './components/trending-carousel';
import { Movie } from './types';
import { Helmet } from 'react-helmet-async';
import { AnimatedHeader } from './components/animated-header';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { getRandomShareMessage } from '@/lib/utils';
import { Footer } from './components/layout/footer';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Disclaimer from './pages/Disclaimer';
import Privacy from './pages/Privacy';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remainingSearches, setRemainingSearches] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const [shareMessage, setShareMessage] = useState('');
  const [perfectMatch, setPerfectMatch] = useState<{
    movie: Movie;
    insights: {
      explanation: string;
      recommendations: { title: string; reason: string; }[];
    };
  } | undefined>();

  useEffect(() => {
    setShareMessage(getRandomShareMessage());
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSearch = (
    results: Movie[], 
    remaining?: number,
    perfectMatchResult?: typeof perfectMatch
  ) => {
    console.log('🎬 Handling search results:', {
      resultsCount: results.length,
      remaining,
      hasPerfectMatch: !!perfectMatchResult,
      currentState: { showResults, searchResults: searchResults.length }
    });

    if (!results || results.length === 0) {
      setError('No results found. Please try different preferences.');
      return;
    }

    // Ensure state updates happen in the correct order
    setError(null);
    setSearchResults(results);
    setShowResults(true);
    setPerfectMatch(perfectMatchResult);
    if (remaining !== undefined) {
      setRemainingSearches(remaining);
    }
    
    // Force scroll after state updates
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    console.log('🔄 Updated state:', {
      showResults: true,
      resultsCount: results.length,
      remaining
    });
  };

  const handleError = (errorMessage: string) => {
    console.error('❌ Search error:', errorMessage);
    setShowResults(false);
    setSearchResults([]);
    setError(errorMessage);
  };

  const handleBack = () => {
    console.log('⬅️ Going back to search');
    setShowResults(false);
    setSearchResults([]);
    setError(null);
    setPerfectMatch(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Router>
      <Routes>
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/" element={
          <div className={`min-h-screen flex flex-col relative transition-colors duration-200 ${
            isDark ? 'bg-[#040B14] text-white' : 'bg-gray-50 text-gray-900'
          }`}>
            <Helmet>
              <title>
                {showResults 
                  ? `${searchResults.length} Movie Recommendations - EzStreamTo`
                  : 'EzStreamTo - Find Where to Watch Movies & TV Shows'}
              </title>
              <meta name="description" content={shareMessage} />
        <meta name="keywords" content="movie streaming, TV shows, where to watch, streaming platforms, movie finder, what to watch, entertainment recommendations" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.href}?v=${Date.now()}`} />
        <meta property="og:title" content={
          showResults
            ? `${searchResults.length} Movie Recommendations - EzStreamTo`
            : 'EzStreamTo - Find Your Next Watch'
        } />
        <meta property="og:description" content={shareMessage} />
        <meta property="og:image" content="https://ezstreamto.com/social-preview.jpg" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={
          showResults
            ? `${searchResults.length} Movie Recommendations - EzStreamTo`
            : 'EzStreamTo - Find Your Next Watch'
        } />
        <meta name="twitter:description" content={shareMessage} />
        <meta name="twitter:image" content="https://ezstreamto.com/social-preview.jpg" />

        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#040B14" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <Header isDark={isDark} onThemeToggle={toggleTheme} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${
            isDark 
              ? 'from-[#0A1A3F] via-[#040B14] to-[#040B14]'
              : 'from-blue-50 via-gray-50 to-gray-50'
          }`} />
          <div className={`absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMjM0NjAiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz48L3N2Zz4=')] opacity-20`} />
        </div>

        <div className="relative z-10">
          {error && (
            <div className={`mb-4 p-3 sm:p-4 rounded-lg ${
              isDark ? 'bg-red-900/20 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              {error}
            </div>
          )}

          {showResults ? (
            <SearchResults
              results={searchResults}
              isDark={isDark}
              onBack={handleBack}
              remainingSearches={remainingSearches}
              isPremium={isPremium}
              isPremiumLoading={isPremiumLoading}
              setShowPremiumModal={setShowPremiumModal}
              perfectMatch={perfectMatch}
            />
          ) : (
            <div>
              <AnimatedHeader isDark={isDark} />
              <div className="w-full -mx-3 sm:-mx-5 md:-mx-6 lg:-mx-8 mb-6 sm:mb-8">
                <TrendingCarousel isDark={isDark} />
              </div>
              <div className="max-w-[90vw] xs:max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
                <PreferenceForm 
                  isDark={isDark} 
                  onSearch={handleSearch}
                  onError={handleError}
                />
              </div>
            </div>
          )}
        </div>
      </main>
          <div className="mt-auto relative z-10">
            <Footer isDark={isDark} />
          </div>
        </div>} />
      </Routes>
    </Router>
  );
}

export default App