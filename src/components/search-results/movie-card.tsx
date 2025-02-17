import { memo, useState } from 'react';
import { Film, Star, Clock, Globe, Youtube, Facebook, Share2, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Movie } from '@/types';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import { FALLBACK_IMAGE } from '@/lib/tmdb';

interface MovieCardProps {
  movie: Movie;
  isDark: boolean;
}

export const MovieCard = memo(function MovieCard({ movie, isDark }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    
    // Create a temporary image to verify the loaded image is valid
    const tempImg = new Image();
    tempImg.onload = () => {
      setImageLoaded(true);
      img.classList.add('loaded');
    };
    tempImg.onerror = () => {
      setImageError(true);
      img.src = FALLBACK_IMAGE;
    };
    tempImg.src = img.src;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageError(true);
    img.src = FALLBACK_IMAGE;
  };

  const shareMessage = `🎬 Found "${movie.title}" on EzStreamTo! Check where to watch it! 🍿\n\n${window.location.origin}`;

  const displayedPlatforms = showAllPlatforms 
    ? movie.streamingPlatforms 
    : movie.streamingPlatforms.slice(0, 3);

  return (
    <div
      className={`group relative h-full ${
        isDark
          ? 'bg-[#0A1A3F] border-blue-900/30'
          : 'bg-white border-gray-200'
      } rounded-lg border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
    >
      {/* Movie Poster */}
      <div className="relative aspect-poster overflow-hidden bg-gray-900">
        <img
          src={movie.imageUrl || FALLBACK_IMAGE}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />
        
        {/* Movie Title and Quick Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5 sm:mb-2 line-clamp-2">
            {movie.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/90">
            <span className="hidden xs:flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {movie.duration}
            </span>
            <span className="flex items-center gap-1">
              <Film className="h-3 w-3" />
              {movie.year}
            </span>
            <div className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-full">
              <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
              {movie.rating.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Movie Details */}
      <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
        {/* Language and Platforms */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <div className="flex items-center gap-1">
            <Globe className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={isDark ? 'text-blue-200' : 'text-gray-600'}>
              {movie.language}
            </span>
          </div>
          {movie.streamingPlatforms && movie.streamingPlatforms.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[70%] justify-end">
              {displayedPlatforms.map((platform) => (
                <span
                  key={platform}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${getPlatformColor(platform)} min-w-[32px] text-center`}
                >
                  {getPlatformShortName(platform)}
                </span>
              ))}
              {movie.streamingPlatforms.length > 3 && !showAllPlatforms && (
                <button
                  onClick={() => setShowAllPlatforms(true)}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white min-w-[24px] text-center transition-colors"
                >
                  +{movie.streamingPlatforms.length - 3}
                </button>
              )}
            </div>
          ) : (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              No streaming info
            </span>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1">
          {movie.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isDark
                  ? 'bg-blue-900/30 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {genre}
            </span>
          ))}
          {movie.genres.length > 3 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isDark
                  ? 'bg-blue-900/30 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              +{movie.genres.length - 3}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="relative">
          <p className={`text-[10px] sm:text-xs ${isDark ? 'text-blue-200/70' : 'text-gray-600'} ${
            showFullDescription ? '' : 'line-clamp-3'
          }`}>
            {movie.description}
          </p>
          {movie.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className={`text-[10px] sm:text-xs font-medium ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              } mt-1`}
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Watch Trailer Button */}
        <Button
          size="sm"
          className="w-full flex items-center justify-center gap-1.5 text-[10px] sm:text-xs py-1.5 sm:py-2"
          onClick={() => window.open(movie.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`, '_blank')}
        >
          <Youtube className="h-3 w-3 sm:h-4 sm:w-4" />
          Watch Trailer
        </Button>

        {/* Share Section */}
        <div className="space-y-2">
          <p className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-blue-200' : 'text-gray-600'} flex items-center gap-1.5`}>
            <Share2 className="h-3 w-3" />
            Share with friends
          </p>
          <div className="flex items-center justify-center gap-2">
            <FacebookShareButton url={window.location.origin} quote={shareMessage}>
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                <Facebook className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </FacebookShareButton>

            <TwitterShareButton url={window.location.origin} title={shareMessage}>
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-900 text-white transition-colors">
                <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </TwitterShareButton>

            <WhatsappShareButton url={window.location.origin} title={shareMessage}>
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors">
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </WhatsappShareButton>
          </div>
        </div>
      </div>
    </div>
  );
});

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    'Netflix': 'bg-red-600',
    'Amazon Prime': 'bg-blue-600',
    'Disney+': 'bg-indigo-600',
    'HBO Max': 'bg-purple-600',
    'Apple TV+': 'bg-gray-800',
    'Hulu': 'bg-green-600',
    'Paramount+': 'bg-blue-800',
    'Peacock': 'bg-teal-600'
  };
  return colors[platform] || 'bg-gray-600';
}

function getPlatformShortName(platform: string): string {
  const shortNames: Record<string, string> = {
    'Netflix': 'Netflix',
    'Amazon Prime': 'Prime',
    'Disney+': 'Disney+',
    'HBO Max': 'HBO',
    'Apple TV+': 'Apple',
    'Hulu': 'Hulu',
    'Paramount+': 'Para+',
    'Peacock': 'Peacock'
  };
  return shortNames[platform] || platform;
}