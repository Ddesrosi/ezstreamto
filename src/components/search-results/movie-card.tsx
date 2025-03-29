import { useState, memo } from 'react';
import { API_CONFIG } from "@/config";
import { mapTMDBGenres } from "@/lib/constants/genres";
import type { Movie } from '@/types';
import { motion } from 'framer-motion';
import { Star, Youtube, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { platformIcons } from '../ui/platform-icons';
import { getPlatformStyle } from '@/lib/constants/platforms';
import { cn } from '@/lib/utils';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';

interface MovieCardProps {
  movie: Movie;
  isDark: boolean;
}

export function MovieCard({ movie, isDark }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

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
    const img = e.target as HTMLImageElement;
    setImageLoaded(true);
    img.classList.add('loaded');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageError(true);
    img.src = API_CONFIG.fallbackImage;
  };

  const handleTrailerClick = () => {
    window.open(
      movie.youtubeUrl || 
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`,
      '_blank'
    );
  };

  const shareMessage = `🎬 Check out "${movie.title}" on EzStreamTo! ${
    movie.rating > 7.5 ? `It's rated ${movie.rating}/10! 🌟` : ''
  }\n\n${window.location.origin}`;

  const getPlatformUrl = (platform: string, movie: Movie): string => {
    const query = encodeURIComponent(movie.title);
    switch (platform.toLowerCase()) {
      case 'netflix':
        return `https://www.netflix.com/search?q=${query}`;
      case 'amazon prime':
      case 'amazon prime video':
      case 'prime video':
      case 'prime':
        return `https://www.primevideo.com/search?phrase=${query}`;
      case 'disney+':
      case 'disney plus':
        return `https://www.disneyplus.com/search?q=${query}`;
      case 'apple tv':
      case 'apple tv+':
        return `https://tv.apple.com/search?q=${query}`;
      case 'youtube':
        return `https://www.youtube.com/results?search_query=${query}+trailer`;
      case 'hulu':
        return `https://www.hulu.com/search?q=${query}`;
      case 'paramount+':
      case 'paramount plus':
        return `https://www.paramountplus.com/shows/search/?q=${query}`;
      case 'peacock':
        return `https://www.peacocktv.com/search?q=${query}`;
      case 'hbo':
      case 'hbo max':
      case 'max':
        return `https://www.max.com/search?q=${query}`;
      default:
        return `https://www.google.com/search?q=${query}`;
    }
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
      {/* Poster */}
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
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
            {movie.title}
          </h3>
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

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Language and Platforms */}
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-xs",
                isDark ? 'text-blue-200/70' : 'text-gray-600'
              )}>
                {movie.language}
              </span>
            </div>
            {uniquePlatforms.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-1.5"
              >
                {(showAllPlatforms ? uniquePlatforms : uniquePlatforms.slice(0, 6)).map((platform) => {
                  const style = getPlatformStyle(platform);
                  const iconKey = Object.keys(platformIcons).find(
                    key => key.toLowerCase() === style?.name.toLowerCase()
                  ) as keyof typeof platformIcons;
                  const PlatformIcon = platformIcons[iconKey];
                  return style ? (
                    <motion.a
                      href={getPlatformUrl(style.name, movie)}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={platform}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "text-xs px-2 py-1.5 rounded-lg shadow-lg transition-all flex items-center justify-center gap-1.5",
                        style.bgColor,
                        style.textColor,
                        "hover:shadow-xl hover:brightness-110"
                      )}
                      title={platform}
                    >
                      {PlatformIcon && <PlatformIcon />}
                      <span className="leading-tight truncate">{style.shortName}</span>
                    </motion.a>
                  ) : null;
                })}
                {uniquePlatforms.length > 6 && (
                  <motion.button
                    onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                    className={cn(
                      "col-span-2 text-xs py-1 rounded-lg transition-colors",
                      isDark 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-700'
                    )}
                  >
                    {showAllPlatforms ? 'Show Less' : `Show ${uniquePlatforms.length - 6} More`}
                  </motion.button>
                )}
              </motion.div>
            )}
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

        {/* Genres */}
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

        {/* Description */}
        <div className={`text-xs ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
          <p className={isExpanded ? '' : 'line-clamp-3'}>
          {movie.description}
          </p>
          {movie.description.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs mt-1 font-medium ${
                isDark 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          )}
        </div>

        {/* Trailer */}
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

        {/* Social Share */}
        <div className="mt-3 space-y-2">
          <p className={cn(
            "text-sm text-center font-medium",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}>
            Share your recommendation
          </p>
          <div className="flex items-center justify-center gap-2">
            <FacebookShareButton url={window.location.origin} quote={shareMessage}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                <Share2 className="h-4 w-4" />
              </div>
            </FacebookShareButton>

            <TwitterShareButton url={window.location.origin} title={shareMessage}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-900 text-white transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </TwitterShareButton>

            <WhatsappShareButton url={window.location.origin} title={shareMessage}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
            </WhatsappShareButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MovieCard;
