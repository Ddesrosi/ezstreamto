import { useState } from 'react';
import { API_CONFIG } from "@/config";
import { mapTMDBGenres } from "@/lib/constants/genres";
import type { Movie } from '@/types';
import { motion } from 'framer-motion';
import { Star, Youtube, Facebook, Phone, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { getPlatformStyle } from '@/lib/constants/platforms';
import { platformNameMap } from '@/lib/constants/platform-aliases';
import { cn } from '@/lib/utils';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';

interface MovieCardProps {
  movie: Movie;
  isDark: boolean;
}

const PLATFORM_SEARCH_URLS: Record<string, string> = {
  Netflix: 'https://www.netflix.com/search?q=',
  'Amazon Prime': 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=',
  'Disney+': 'https://www.disneyplus.com/search/',
  'HBO Max': 'https://www.max.com/search?q=',
  'Apple TV+': 'https://tv.apple.com/search/',
  Hulu: 'https://www.hulu.com/search?q=',
  'Paramount+': 'https://www.paramountplus.com/shows/',
  Peacock: 'https://www.peacocktv.com/search?q='
};

function MovieCard({ movie, isDark }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const uniquePlatforms = movie.streamingPlatforms.reduce((acc: string[], platform) => {
    const exists = acc.some(existing => {
      const existingStyle = getPlatformStyle(existing);
      const newStyle = getPlatformStyle(platform);
      return existingStyle?.name === newStyle?.name;
    });
    if (!exists && getPlatformStyle(platform)) {
      acc.push(platform);
    }
    return acc;
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    (e.target as HTMLImageElement).classList.add('loaded');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    (e.target as HTMLImageElement).src = API_CONFIG.fallbackImage;
  };

  const shareMessage = `🎬 Check out "${movie.title}" on EzStreamTo! ${
    movie.rating > 7.5 ? `It's rated ${movie.rating}/10! 🌟` : ''
  }\n\n${window.location.origin}`;

  const handleTrailerClick = () => {
    window.open(
      movie.youtubeUrl || 
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`,
      '_blank'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-lg border overflow-hidden group",
        isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
        <img
          src={movie.imageUrl}
          alt={`${movie.title} Poster`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 brightness-110"
          loading="lazy"
          decoding="async"
          fetchpriority="high"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
        {!imageLoaded && !imageError && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">{movie.title}</h3>
          <div className="flex items-center gap-2 text-xs text-white/90">
            <span>{movie.year}</span>
            <span>•</span>
            {(typeof movie.duration === 'number' || movie.duration === 'TV Series') && (
              <>
                <span>{typeof movie.duration === 'number' ? `${movie.duration} min` : movie.duration}</span>
                <span>•</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
              <span>{movie.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs", isDark ? 'text-blue-200/70' : 'text-gray-600')}>{movie.language}</span>
            </div>

            <p className={cn("text-sm font-medium mb-2", isDark ? 'text-blue-400' : 'text-blue-600')}>Available on</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {uniquePlatforms.map((platform) => {
                const style = getPlatformStyle(platform);
                const platformName = style?.name || platform;
                const baseUrl = PLATFORM_SEARCH_URLS[platformName] || `https://www.${platformName.toLowerCase().replace(/\s/g, '')}.com`;
                return style ? (
                  <a
                    key={platform}
                    href={`${baseUrl}${encodeURIComponent(movie.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap",
                      style.bgColor,
                      style.textColor,
                      "hover:opacity-90")}
                  >
                    {style.shortName}
                  </a>
                ) : null;
              })}
            </div>

            {uniquePlatforms.length === 0 && (
              <span className={cn(
                "text-xs px-3 py-1.5 rounded-lg inline-block",
                isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-500'
              )}>
                Unavailable on any platform
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 min-h-[1.75rem]">
          {movie.genres.map(genre => (
            <motion.span
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              key={genre}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap",
                isDark 
                  ? 'bg-blue-900/20 text-blue-200 ring-1 ring-blue-500/20' 
                  : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50'
              )}
            >
              {genre}
            </motion.span>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "text-xs space-y-1",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}
        >
          <p className={cn(
            "transition-all duration-200",
            !isExpanded && 'line-clamp-4'
          )}>
            {movie.description}
          </p>
          {movie.description.length > 150 && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors w-full justify-center mt-1",
                isDark 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{isExpanded ? 'Show Less' : 'Read More'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </motion.button>
          )}
        </motion.div>

        <Button
          onClick={handleTrailerClick}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-10 text-sm",
            "transition-all duration-300 hover:scale-[1.02]",
            "h-12 text-base font-medium",
            isDark 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-500 hover:bg-blue-600'
          )}
        >
          <Youtube className="h-5 w-5" />
          Watch Trailer
        </Button>

        <div className="mt-3 space-y-2">
          <p className={cn("text-sm text-center font-medium", isDark ? 'text-blue-200/70' : 'text-gray-600')}>
            Share your recommendation
          </p>
          <div className="flex items-center justify-center gap-2">
            <FacebookShareButton url={window.location.origin} quote={shareMessage}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                <Facebook className="h-4 w-4" />
              </div>
            </FacebookShareButton>
            <TwitterShareButton url={window.location.origin} title={shareMessage}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-900 text-white transition-colors">
                <X className="h-4 w-4" />
              </div>
            </TwitterShareButton>
            <WhatsappShareButton url={window.location.origin} title={shareMessage}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors">
                <Phone className="h-4 w-4" />
              </div>
            </WhatsappShareButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { MovieCard };
