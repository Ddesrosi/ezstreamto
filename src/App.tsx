import { useState, useEffect, useCallback } from 'react';
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
import PremiumSuccess from './pages/PremiumSuccess';
import { supabase } from './lib/supabaseClient';
import { useRef } from 'react';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remainingSearches, setRemainingSearches] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumStatus();
  const [shareMessage, setShareMessage] = useState('');
  const [perfectMatch, setPerfectMatch] = useState<{
    movie: Movie;
    insights: {
      explanation: string;
      recommendations: { title: string; reason: string; }[];
    };
  } | undefined>();

  const hasLoggedRef = useRef(false);

  const visitorUUID = getOrCreateUUID(); // ✅ UUID stable utilisé partout
console.log("🧭 visitorUUID initialized in App.tsx:", visitorUUID);

  const visitorUUIDRef = useRef<string | null>(null); // ✅ Stockera le UUID de manière stable

    useEffect(() => {
    setShareMessage(getRandomShareMessage());
  }, []);

  useEffect(() => {
  const uuid = getOrCreateUUID();
  visitorUUIDRef.current = uuid;
  console.log("🧭 UUID initialized in App.tsx:", uuid);
}, []);

 useEffect(() => {
  const logPageView = async () => {
  console.log('📌 logPageView() called in App.tsx');

    // ✅ Double protection anti-duplicata
    if (hasLoggedRef.current || sessionStorage.getItem('hasLoggedPageView')) {
      console.log('⏭️ Page view already logged this session');
      return;
    }

    hasLoggedRef.current = true;

    try {
      const response = await fetch('https://api64.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip;

      const { error } = await supabase.from('page_views').insert([
        { ip_address: ip }
      ]);

      if (error) {
        console.error('❌ Failed to log page view:', error.message);
      } else {
        console.log('✅ Page view logged with IP:', ip);
        sessionStorage.setItem('hasLoggedPageView', 'true');
      }
    } catch (err) {
      console.error('❌ Error getting IP address:', err);
    }
  };

  logPageView();
}, []);


  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSearch = useCallback((
    results: Movie[], 
    remaining?: number,
    perfectMatchResult?: typeof perfectMatch
  ) => {
    console.log('🔍 Search Results Debug:', {
      hasResults: !!results,
      resultsLength: results?.length,
      remaining: remaining,
      hasPerfectMatch: !!perfectMatchResult,
      firstResult: results?.[0]
    });

    console.log('Remaining searches received:', remaining);

    if (!results || results.length === 0) {
      console.warn('❌ No results received');
      setError('No results found. Please try different preferences.');
      return;
    }

    // Ensure state updates happen in the correct order
    setError(null);
    setShowResults(true);
    setSearchResults(results);
    setPerfectMatch(perfectMatchResult);
    console.log('✅ States updated:', {
      error: null,
      showResults: true,
      resultsLength: results.length,
      hasPerfectMatch: !!perfectMatchResult
    });

  if (remaining !== undefined) {
  console.log("✅ App.tsx → setting remainingSearches to:", remaining);
  setRemainingSearches(remaining);
}

    // Force scroll after state updates
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    console.error('❌ Search error:', errorMessage);
    setShowResults(false);
    setSearchResults([]);
    setError(errorMessage);
  }, []);

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
        <Route path="/premium-success" element={<PremiumSuccess />} />
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

                {/* Debug info */}
                {import.meta.env.DEV && (
                  <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
                    showResults: {String(showResults)}<br />
                    resultsCount: {searchResults.length}<br />
                    error: {error || 'none'}
                  </div>
                )}

                {showResults ? (
                  <div key={searchResults.length}>
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
                  </div>
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
                        visitorUUID={visitorUUID}
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

export default App;