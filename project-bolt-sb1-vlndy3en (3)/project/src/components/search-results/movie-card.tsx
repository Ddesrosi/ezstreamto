import { memo, useState } from 'react';
import { Film, Star, Clock, Globe, Youtube, Facebook, Share2, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Movie } from '@/types';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import { FALLBACK_IMAGE } from '@/lib/tmdb';
import { APPROVED_PLATFORMS } from '@/lib/constants/platforms';

interface MovieCardProps {
  movie: Movie;
  isDark: boolean;
}

export const MovieCard = memo(function MovieCard({ movie, isDark }: MovieCardProps) {
  console.log('🎬 MovieCard Render:', {
    title: movie.title,
    platforms: movie.streamingPlatforms,
    hasTrailer: !!movie.youtubeUrl,
    youtubeUrl: movie.youtubeUrl,
    imageUrl: movie.imageUrl
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const shareMessage = `🎬 Check out "${movie.title}" (${movie.year}) - ${movie.rating}/10 stars\n\n${movie.description?.slice(0, 100)}...\n\nWatch on: ${movie.streamingPlatforms.join(', ') || 'Not available for streaming'}\n\nFind more movies at EzStreamTo!`;
  const shareUrl = `${window.location.origin}${window.location.pathname}?movie=${encodeURIComponent(movie.title)}`;

  return (
    <div className={`group relative h-full ${isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      {/* Poster Section */}
      <div className="relative aspect-poster overflow-hidden bg-gray-900">
        <img
          src={movie.imageUrl || FALLBACK_IMAGE}
          alt={movie.title}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          onLoad={(e) => {
            const target = e.target as HTMLImageElement;
            target.classList.add('loaded');
            setImageLoaded(true);
          }}
          onError={() => {
            setImageError(true);
            const img = document.getElementById(`movie-img-${movie.id}`) as HTMLImageElement;
            if (img) img.src = FALLBACK_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />
        
        {/* Title and Basic Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5 sm:mb-2 line-clamp-2">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/90">
            <span className="flex items-center gap-1">
              <Film className="h-3 w-3" />
              {movie.year}
            </span>
            {typeof movie.duration === 'number' && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {movie.duration} min
                </span>
              </>
            )}
            <span>•</span>
            <div className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-full">
              <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
              {movie.rating.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col h-full">
        {/* Language and Streaming Platforms */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Globe className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                {movie.language}
              </span>
            </div>
          </div>

          {/* Streaming Platforms */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {(movie.streamingPlatforms || []).filter(platform => platform !== 'Not available').map((platform, index) => (
              <div
                key={`${platform}-${index}`}
                className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isDark
                    ? platform === 'Netflix' ? 'bg-red-900/30 text-red-200'
                      : platform === 'Disney+' ? 'bg-blue-900/30 text-blue-200'
                      : platform === 'Amazon Prime' ? 'bg-yellow-900/30 text-yellow-200'
                      : platform === 'HBO Max' ? 'bg-purple-900/30 text-purple-200'
                      : platform === 'Apple TV+' ? 'bg-gray-900/30 text-gray-200'
                      : platform === 'Hulu' ? 'bg-green-900/30 text-green-200'
                      : platform === 'Paramount+' ? 'bg-blue-900/30 text-blue-200'
                      : platform === 'Peacock' ? 'bg-teal-900/30 text-teal-200'
                      : 'bg-blue-900/30 text-blue-200'
                    : platform === 'Netflix' ? 'bg-red-50 text-red-700'
                      : platform === 'Disney+' ? 'bg-blue-50 text-blue-700'
                      : platform === 'Amazon Prime' ? 'bg-yellow-50 text-yellow-700'
                      : platform === 'HBO Max' ? 'bg-purple-50 text-purple-700'
                      : platform === 'Apple TV+' ? 'bg-gray-50 text-gray-700'
                      : platform === 'Hulu' ? 'bg-green-50 text-green-700'
                      : platform === 'Paramount+' ? 'bg-blue-50 text-blue-700'
                      : platform === 'Peacock' ? 'bg-teal-50 text-teal-700'
                      : 'bg-blue-50 text-blue-700'
                }`}
              >
                {platform === 'Netflix' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5.398 0v24l6.87-3.35V0H5.398zm12.334 0v24l-6.87-3.35V0h6.87z"/></svg>}
                {platform === 'Amazon Prime' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.54 0h18.92C22.87 0 24 1.13 24 2.54v18.92c0 1.41-1.13 2.54-2.54 2.54H2.54C1.13 24 0 22.87 0 21.46V2.54C0 1.13 1.13 0 2.54 0zm16.2 13.21c-.32.37-.67.71-1.05 1.03-2.14 1.77-4.85 2.65-7.69 2.65-2.84 0-5.55-.88-7.69-2.65-.38-.32-.73-.66-1.05-1.03-.2-.23-.03-.58.27-.53.64.11 1.28.19 1.92.24 3.15.25 6.33-.25 9.36-1.49.6-.25 1.19-.53 1.76-.84.23-.13.5.09.41.34z"/></svg>}
                {platform === 'Disney+' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.084 6.658h17.832v10.684H3.084z"/></svg>}
                {platform === 'HBO Max' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 0v24h3V0h-3zm-6 6v12h3V6h-3zm12 0v12h3V6h-3z"/></svg>}
                {platform === 'Apple TV+' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c1.97 0 3.567 1.597 3.567 3.567 0 .235-.024.463-.068.684-.638-.319-1.355-.501-2.117-.501-2.612 0-4.733 2.121-4.733 4.733 0 .762.182 1.479.501 2.117-.221.044-.449.068-.684.068-1.97 0-3.567-1.597-3.567-3.567 0-1.97 1.597-3.567 3.567-3.567.235 0 .463.024.684.068.319-.638.501-1.355.501-2.117 0-2.612-2.121-4.733-4.733-4.733-.762 0-1.479.182-2.117.501C3.624 3.624 3.6 3.396 3.6 3.161 3.6 1.191 5.197-.406 7.167-.406c1.97 0 3.567 1.597 3.567 3.567 0 .235-.024.463-.068.684.638.319 1.355.501 2.117.501z"/></svg>}
                {platform === 'Hulu' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/></svg>}
                {platform === 'Paramount+' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z"/></svg>}
                {platform === 'Peacock' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z"/></svg>}
                {platform}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className={`text-sm ${isDark ? 'text-blue-200/80' : 'text-gray-600'} mb-4 flex-grow`}>
          {movie.description && (
            <p className={`${showFullDescription ? '' : 'line-clamp-3'} leading-relaxed`}>
              {movie.description}
            </p>
          )}
          {movie.description && movie.description.length > 100 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className={`text-sm mt-2 font-medium flex items-center gap-1.5 ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              } hover:underline transition-colors`}
            >
              <span className="text-xs">
                {showFullDescription ? '↑' : '↓'}
              </span>
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-blue-900/30 space-y-4">
          {/* Trailer Button */}
          {movie.youtubeUrl && <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(movie.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`, '_blank')}
            className={`w-full h-10 text-sm font-medium group/trailer flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/20'
            }`}
          >
            <Youtube className="h-5 w-5 transition-all group-hover/trailer:scale-110 group-hover/trailer:rotate-3" />
            Watch Trailer
          </Button>}

          {/* Share Buttons */}
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-500'}`}>
              Share this movie:
            </span>
            <div className="flex items-center gap-2">
              <FacebookShareButton url={shareUrl} quote={shareMessage}>
                <div className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 hover:text-blue-300' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                }`}>
                  <Facebook className="h-5 w-5 transition-transform hover:scale-110 hover:rotate-3" />
                </div>
              </FacebookShareButton>

              <TwitterShareButton url={shareUrl} title={shareMessage}>
                <div className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'bg-neutral-900/20 hover:bg-neutral-900/30 text-neutral-400 hover:text-neutral-300' 
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-700'
                }`}>
                  <svg className="h-5 w-5 transition-transform hover:scale-110 hover:rotate-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              </TwitterShareButton>

              <WhatsappShareButton url={shareUrl} title={shareMessage}>
                <div className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'bg-green-900/20 hover:bg-green-900/30 text-green-400 hover:text-green-300' 
                    : 'bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700'
                }`}>
                  <MessageCircle className="h-5 w-5 transition-transform hover:scale-110 hover:rotate-3" />
                </div>
              </WhatsappShareButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});