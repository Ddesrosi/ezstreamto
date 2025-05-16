import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, Youtube, Facebook, MessageCircle, Sparkles } from 'lucide-react';
import { Movie } from '@/types';
import { PerfectMatchInsights } from '@/lib/perfect-match';
import { APPROVED_PLATFORMS, PLATFORM_SEARCH_URLS } from '@/lib/constants/platforms';
import { cn } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/tmdb';
import { Button } from '../ui/button';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';

function getPlatformStyle(platform: string) {
  const approvedPlatform = Object.entries(APPROVED_PLATFORMS).find(([name, data]) => 
    data.matches.includes(platform) || name === platform
  );

  return approvedPlatform ? {
    name: approvedPlatform[0],
    ...approvedPlatform[1]
  } : null;
}

interface PerfectMatchCardProps {
  movie: Movie;
  insights: PerfectMatchInsights;
  isDark: boolean;
}

export function PerfectMatchCard({ movie, insights, isDark }: PerfectMatchCardProps) {
  console.log("🧩 Inside PerfectMatchCard – movie =", movie);
  console.log("🧩 Inside PerfectMatchCard – insights =", insights);
  if (!movie || typeof movie !== 'object') {
    console.warn('⚠️ PerfectMatchCard: movie is undefined or invalid:', movie);
    return null;
  }

  if (!insights || typeof insights !== 'object') {
    console.warn('⚠️ PerfectMatchCard: insights is undefined or invalid:', insights);
    return null;
  }

  // Extract explanation from insights safely
  const getExplanation = (insights: PerfectMatchInsights): string => {
    if (!insights.reason) return 'No explanation available';
    
    try {
      if (typeof insights.reason === 'string') {
        const parsed = JSON.parse(insights.reason);
        return parsed.explanation || insights.reason;
      }
      return String(insights.reason);
    } catch (error) {
      console.warn('Failed to parse explanation:', error);
      return String(insights.reason);
    }
  };

  if (!Array.isArray(movie.streamingPlatforms)) {
    console.warn("⚠️ movie.streamingPlatforms is not an array, defaulting to empty array");
    movie.streamingPlatforms = [];
  }

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(movie.imageUrl || FALLBACK_IMAGE);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if movie.imageUrl is a valid URL
    if (!movie.imageUrl || !isValidUrl(movie.imageUrl)) {
      console.warn('⚠️ Invalid movie.imageUrl:', movie.imageUrl, 'Using FALLBACK_IMAGE');
      setImageUrl(FALLBACK_IMAGE);
      setImageLoaded(true);
      setImageError(true);
      return;
    }

    setImageLoaded(false);
    setImageError(false);
    setImageUrl(movie.imageUrl);

    const img = new Image();
    img.src = movie.imageUrl;

    const handleLoad = () => {
      setImageLoaded(true);
      setImageError(false);
      clearTimeout(timeoutRef.current as NodeJS.Timeout);
    };

    const handleError = () => {
      console.error('❌ Image load failed for:', movie.imageUrl, 'Using FALLBACK_IMAGE');
      setImageLoaded(true);
      setImageError(true);
      setImageUrl(FALLBACK_IMAGE);
      clearTimeout(timeoutRef.current as NodeJS.Timeout);
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    timeoutRef.current = setTimeout(() => {
      console.warn('⌛ Image load timeout for:', movie.imageUrl, 'Using FALLBACK_IMAGE');
      handleError();
    }, 5000); // 5 seconds timeout

    return () => {
      img.onload = null;
      img.onerror = null;
      clearTimeout(timeoutRef.current as NodeJS.Timeout);
    };
  }, [movie.imageUrl]);

  const uniquePlatforms = (movie.streamingPlatforms || []).reduce((acc: string[], platform) => {
    const exists = acc.some(existing => {
      const existingStyle = getPlatformStyle(existing);
      const newStyle = getPlatformStyle(platform);
      return existingStyle?.name === newStyle?.name;
    });
    if (!exists) acc.push(platform);
    return acc;
  }, []);

  const shareMessage = `🎬 Found my perfect movie match "${movie.title}" on EzStreamTo! Check it out! 🍿\n\n${window.location.origin}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6 }}
      className={cn(
        "w-full rounded-lg border overflow-hidden",
        isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'
      )}
    >
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="w-full md:w-full">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 shadow-xl">
              <img
                src={imageUrl}
                alt={movie.title}
                className={cn(
                  "w-full h-full object-cover transition-all duration-300 group-hover:scale-105 brightness-110",
                  !imageLoaded && "opacity-0"
                )}
                onLoad={() => {}}
                onError={() => {}}
                crossOrigin="anonymous"
              />
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>

            <div className="mt-4 space-y-2">
              <h2 className="text-2xl font-bold text-white">{movie.title}</h2>
              <p className="text-sm text-gray-300">
                {movie.year} • {movie.duration} min • ⭐ {movie.rating}
              </p>
              <p className="text-sm text-gray-400">{movie.language}</p>

              <div className="mt-4">
                <p className="text-sm font-semibold mb-2 text-white">Available on</p>
                <div className="flex flex-wrap gap-2">
                  {movie.streamingPlatforms && movie.streamingPlatforms.length > 0 ? (
                    movie.streamingPlatforms.map((platform) => {
                      const style = getPlatformStyle(platform);
                      const platformName = style?.name || platform;
                      const baseUrl = PLATFORM_SEARCH_URLS[platformName] || `https://www.${platformName.toLowerCase().replace(/\s/g, '')}.com`;
                      
                      return style ? (
                        <a
                          key={platform}
                          href={`${baseUrl}${encodeURIComponent(movie.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap",
                            style.bgColor,
                            style.textColor,
                            "hover:opacity-90"
                          )}
                        >
                          {style.shortName}
                        </a>
                      ) : null;
                    })
                  ) : (
                    <span className={cn(
                      "text-xs px-3 py-1.5 rounded-lg inline-block",
                      isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-500'
                    )}>
                      Unavailable on any platform
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-white/10 text-white text-xs px-2 py-1 rounded"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <h4 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isDark ? 'text-blue-100' : 'text-gray-900')}>
                <ThumbsUp className="h-5 w-5 text-green-500" />
                Why It's Perfect for You
              </h4>
              <p className={cn(
                "text-base sm:text-lg leading-relaxed",
                isDark ? 'text-blue-200/70' : 'text-gray-600'
              )}>
                {getExplanation(insights)}
              </p>
            </div>

            <div>
              <Button
                onClick={() => window.open(movie.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${movie.year} trailer`)}`, '_blank')}
                className={cn("mt-4 flex items-center justify-center gap-2 h-12 text-base font-medium", isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600')}
              >
                <Youtube className="h-5 w-5" />
                Watch Trailer
              </Button>
            </div>

            <div className="mt-6">
              <div className="mt-4 space-y-2">
                <p className={cn("text-sm font-medium flex items-center gap-1.5", isDark ? 'text-blue-200' : 'text-gray-600')}>
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
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

            <div>
              <h4 className={cn("text-xl font-semibold mb-4 flex items-center gap-2", isDark ? 'text-blue-100' : 'text-gray-900')}>
                <Sparkles className="h-5 w-5 text-amber-400" />
                You Might Also Like
              </h4>
              <div className="space-y-3">
                {insights.similar
                  .filter(rec =>
                    rec &&
                    typeof rec === 'object' &&
                    rec.title &&
                    Array.isArray(rec.streamingPlatforms)
                  )
                  .map((rec, index) => {
                    const normalizedPlatforms = rec.streamingPlatforms || [];
                    const imageUrl = rec.imageUrl || FALLBACK_IMAGE;
                    const title = rec.title || 'Untitled';
                    const year = rec.year || 'N/A';
                    const rating = rec.rating !== undefined ? rec.rating : null;
                    const genres = rec.genres || [];
                    const duration = typeof rec.duration === 'number' ? `${rec.duration} min` : rec.duration || 'Unknown duration';
                    const reason = rec.description || rec.reason || 'No description available';
                    const youtubeUrl = rec.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;

                    return (
                      <div key={index} className={cn("p-4 rounded-lg transition-all duration-300 hover:scale-[1.01]", isDark ? 'bg-blue-900/20' : 'bg-blue-50')}>
                        <div className="flex gap-4">
                          <div className="flex-none w-24 h-36 rounded overflow-hidden bg-gray-900">
                            <img
                              src={imageUrl}
                              alt={`${title} poster`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onLoad={(e) => (e.currentTarget.classList.add("loaded"))}
                              onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className={cn("text-lg font-medium mb-2", isDark ? 'text-blue-100' : 'text-gray-900')}>{title}</h5>
                            <div className="flex flex-wrap gap-2 text-xs mb-2">
                              <span>{year}</span>
                              <span>•</span>
                              <span>{duration}</span>
                              {rating !== null && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
                                    <span>{rating.toFixed(1)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {normalizedPlatforms.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {normalizedPlatforms.map((platform) => {
                                  const style = getPlatformStyle(platform);
                                  const baseUrl = PLATFORM_SEARCH_URLS[style?.name || ''];
                                  return style && baseUrl ? (
                                    <a
                                      key={platform}
                                      href={`${baseUrl}${encodeURIComponent(title)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn("text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap", style.bgColor, style.textColor, "hover:opacity-90")}
                                    >
                                      {style.shortName}
                                    </a>
                                  ) : null;
                                })}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {genres.map((genre, idx) => (
                                <span
                                  key={idx}
                                  className={cn("text-xs px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap", isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800')}
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                            <p className={cn("text-sm", isDark ? 'text-blue-200/70' : 'text-gray-600')}>{reason}</p>
                            <div className="space-y-3 mt-3">
                              <Button
                                onClick={() => window.open(youtubeUrl, '_blank')}
                                className={cn("w-full flex items-center justify-center gap-2 h-12 text-base font-medium", isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600')}
                              >
                                <Youtube className="h-5 w-5" />
                                Watch Trailer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
