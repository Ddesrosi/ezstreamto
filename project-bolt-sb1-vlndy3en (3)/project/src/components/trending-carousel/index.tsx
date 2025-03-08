import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Movie } from '@/types';

interface TrendingCarouselProps {
  isDark: boolean;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function TrendingCarousel({ isDark }: TrendingCarouselProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);
  const autoScrollRef = useRef<number | null>(null);

  async function fetchTrendingMovies() {
    try {
      const now = Date.now();
      // Don't fetch if last fetch was less than 1 minute ago (rate limiting protection)
      if (now - lastFetchRef.current < 60000) return;
      
      lastFetchRef.current = now;
      
      const response = await fetch('https://api.themoviedb.org/3/trending/all/day', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MTNjZDMzZjdjNDViNjUwMTQ4NzljYWVhZDcyY2FiYSIsIm5iZiI6MTczODAwNTE3Ni43MjMsInN1YiI6IjY3OTdkYWI4YTZlNDEyODNmMTJiNDU2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dM4keiy2kA6XcUufnGGSnCDCUJGwFMg91pq4I5Bziq8',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch trending movies');

      const data = await response.json();
      const trendingMovies: Movie[] = data.results
        .filter((item: any) => item.poster_path) // Only include items with posters
        .map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name,
          year: new Date(item.release_date || item.first_air_date).getFullYear(),
          rating: item.vote_average,
          imageUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          backdropUrl: item.backdrop_path 
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : undefined,
          description: item.overview,
          duration: item.media_type === 'movie' ? 'Movie' : 'TV Series',
          language: item.original_language?.toUpperCase() || 'EN',
          genres: [],
          streamingPlatforms: []
        }));

      setMovies(trendingMovies);
      setError(null);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      setError('Failed to fetch trending movies');
    } finally {
      setIsLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    const refreshInterval = setInterval(fetchTrendingMovies, REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    stopAutoScroll();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    startAutoScroll();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      startAutoScroll();
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    stopAutoScroll();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.touches[0].clientX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    startAutoScroll();
  };

  // Auto-scroll functionality
  const startAutoScroll = () => {
    if (autoScrollRef.current) return;
    
    autoScrollRef.current = window.setInterval(() => {
      if (!containerRef.current || isDragging) return;
      
      containerRef.current.scrollLeft += 1;
      
      // Reset scroll position when reaching the end
      if (containerRef.current.scrollLeft >= containerRef.current.scrollWidth / 2) {
        containerRef.current.scrollLeft = 0;
      }
    }, 30);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      window.clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  // Start auto-scroll when component mounts
  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.classList.add('loaded');
  };

  if (isLoading) {
    return (
      <div className="w-full h-[140px] sm:h-[180px] bg-gradient-to-r from-blue-900/20 to-blue-800/20 animate-pulse rounded-lg" />
    );
  }

  if (error || !movies.length) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Gradient Overlays */}
      <div 
        className={`absolute inset-y-0 left-0 w-12 sm:w-16 z-10 pointer-events-none bg-gradient-to-r ${
          isDark 
            ? 'from-[#040B14] to-transparent' 
            : 'from-gray-50 to-transparent'
        }`} 
      />
      <div 
        className={`absolute inset-y-0 right-0 w-12 sm:w-16 z-10 pointer-events-none bg-gradient-to-l ${
          isDark 
            ? 'from-[#040B14] to-transparent' 
            : 'from-gray-50 to-transparent'
        }`} 
      />

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className={`flex gap-3 sm:gap-4 overflow-x-auto py-3 sm:py-4 px-6 sm:px-8 scrollbar-none select-none scroll-touch ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          scrollBehavior: isDragging ? 'auto' : 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {[...movies, ...movies].map((movie, index) => (
          <motion.div
            key={`${movie.id}-${index}`}
            className="relative flex-none w-[100px] sm:w-[120px] rounded-lg overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="relative aspect-poster overflow-hidden bg-gray-900">
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                draggable="false"
                onLoad={handleImageLoad}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="text-[10px] sm:text-xs text-white font-medium line-clamp-2">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" fill="currentColor" />
                    <span className="text-[8px] sm:text-[10px] text-white/90">
                      {movie.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}