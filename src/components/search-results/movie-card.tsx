import { useState, memo } from 'react';
import { API_CONFIG } from "@/config";
import { mapTMDBGenres } from "@/lib/constants/genres";
import { APPROVED_PLATFORMS } from "@/lib/constants/platforms";
import type { Movie } from '@/types';
import { motion } from 'framer-motion';
import { Star, Youtube, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';

interface MovieCardProps {
  movie: Movie;
  isDark: boolean;
}

function getPlatformStyle(platform: string) {
  const approvedPlatform = Object.entries(APPROVED_PLATFORMS).find(([name, data]) => 
    data.matches.includes(platform) || name === platform
  );

  return approvedPlatform ? {
    name: approvedPlatform[0],
    ...approvedPlatform[1]
  } : null;
}

export function MovieCard({ movie, isDark }: MovieCardProps) {
  console.log("🎬 [DEBUG] Rendering MovieCard for:", movie.title);
console.log("📆 [DEBUG] Release Year:", movie.year);
console.log("⏳ [DEBUG] Duration:", movie.duration);
console.log("⭐ [DEBUG] Rating:", movie.rating);
console.log("📺 [DEBUG] Streaming Platforms:", movie.streamingPlatforms);
console.log("🎞️ [DEBUG] Trailer URL:", movie.youtubeUrl);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Remove duplicate platforms
  const uniquePlatforms = [...new Set(movie.streamingPlatforms)];

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
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
        <img
          src={movie.imageUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
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
          <span className={cn(
            "text-xs",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}>
            {movie.language}
          </span>
          <div className="flex flex-wrap justify-end gap-2 w-auto">
            {uniquePlatforms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniquePlatforms.map(platform => {
                  const style = getPlatformStyle(platform);
                  return style ? (
                    <span
                      key={platform}
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap",
                        style.bgColor,
                        style.textColor,
                        "hover:opacity-90"
                      )}
                    >
                      {style.shortName}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              )}>
                Not Available
              </span>
            )}
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1 min-h-[1.75rem]">
          {movie.genres.map(genre => (
            <span
              key={genre}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap",
                isDark 
                  ? 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/40' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              )}
            >
              {genre}
            </span>
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

        {/* Trailer and Share Buttons */}
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
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                </svg>
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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