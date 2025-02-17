import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Youtube, Facebook, MessageCircle, Share2 } from 'lucide-react';
import { Movie } from '@/types';
import { PerfectMatchInsights } from '@/lib/perfect-match';
import { cn } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/tmdb';
import { Button } from '../ui/button';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';

interface PerfectMatchCardProps {
  movie: Movie;
  insights: PerfectMatchInsights;
  isDark: boolean;
}

export function PerfectMatchCard({ movie, insights, isDark }: PerfectMatchCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const shareMessage = `🎬 Found my perfect movie match "${movie.title}" on EzStreamTo! Check it out! 🍿\n\n${window.location.origin}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "col-span-full w-full rounded-lg border overflow-hidden",
        isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'
      )}
    >
      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Movie Poster */}
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
            <img
              src={movie.imageUrl || FALLBACK_IMAGE}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="eager"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-xl font-bold text-white mb-2">
                {movie.title}
              </h3>
              <div className="flex flex-col gap-1 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <span>{movie.year}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span>{movie.language}</span>
                  <span>•</span>
                  <span>{movie.duration}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.genres.slice(0, 3).map((genre, index) => (
                    <span
                      key={genre}
                      className="text-xs px-1.5 py-0.5 rounded-full bg-white/20"
                    >
                      {genre}
                    </span>
                  ))}
                  {movie.genres.length > 3 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                      +{movie.genres.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="md:col-span-2 space-y-6">
            {/* Why It's Perfect */}
            <div>
              <h4 className={cn(
                "text-lg font-semibold mb-2 flex items-center gap-2",
                isDark ? 'text-blue-100' : 'text-gray-900'
              )}>
                <ThumbsUp className="h-5 w-5 text-green-500" />
                Why It's Perfect for You
              </h4>
              <p className={cn(
                "text-base leading-relaxed",
                isDark ? 'text-blue-200/70' : 'text-gray-600'
              )}>
                {insights.explanation}
              </p>

              {/* Watch Trailer Button */}
              <Button
                onClick={() => window.open(movie.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`, '_blank')}
                className="mt-4 flex items-center gap-2"
              >
                <Youtube className="h-4 w-4" />
                Watch Trailer
              </Button>

              {/* Social Sharing */}
              <div className="mt-4 space-y-2">
                <p className={cn(
                  "text-sm font-medium flex items-center gap-1.5",
                  isDark ? 'text-blue-200' : 'text-gray-600'
                )}>
                  Share your perfect match
                </p>
                <div className="flex items-center gap-2">
                  <FacebookShareButton url={window.location.origin} quote={shareMessage}>
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                      <Facebook className="h-4 w-4" />
                    </div>
                  </FacebookShareButton>

                  <TwitterShareButton url={window.location.origin} title={shareMessage}>
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-900 text-white transition-colors">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                  </TwitterShareButton>

                  <WhatsappShareButton url={window.location.origin} title={shareMessage}>
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                  </WhatsappShareButton>
                </div>
              </div>
            </div>

            {/* Similar Recommendations */}
            <div>
              <h4 className={cn(
                "text-lg font-semibold mb-3",
                isDark ? 'text-blue-100' : 'text-gray-900'
              )}>
                You Might Also Like
              </h4>
              <div className="space-y-3">
                {insights.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg",
                      isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                    )}
                  >
                    <div className="flex gap-4">
                      {/* Recommendation Poster */}
                      {rec.imageUrl && (
                        <div className="flex-none w-16 h-24 rounded overflow-hidden">
                          <img
                            src={rec.imageUrl}
                            alt={rec.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Recommendation Details */}
                      <div className="flex-1">
                        <h5 className={cn(
                          "font-medium mb-1",
                          isDark ? 'text-blue-100' : 'text-gray-900'
                        )}>
                          {rec.title}
                        </h5>
                        
                        {/* Movie Details */}
                        <div className="flex flex-wrap gap-2 text-xs mb-2">
                          {rec.year && <span>{rec.year}</span>}
                          {rec.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
                              <span>{rec.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {rec.language && <span>{rec.language}</span>}
                        </div>
                        
                        {/* Genres */}
                        {rec.genres && rec.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {rec.genres.map((genre, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-full",
                                  isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                                )}
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <p className={cn(
                          "text-sm",
                          isDark ? 'text-blue-200/70' : 'text-gray-600'
                        )}>
                          {rec.reason}
                        </p>
                        
                        {/* Trailer Button */}
                        {rec.youtubeUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(rec.youtubeUrl, '_blank')}
                            className="mt-2 h-8 text-xs"
                          >
                            <Youtube className="h-3 w-3 mr-1" />
                            Watch Trailer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}