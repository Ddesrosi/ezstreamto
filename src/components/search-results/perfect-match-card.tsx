import { Movie } from "@/types";
import { PerfectMatchInsights } from "@/lib/perfect-match";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/lib/tmdb";
import { PLATFORM_SEARCH_URLS, APPROVED_PLATFORMS } from "@/lib/constants/platforms";
import { Button } from "../ui/button";
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from "react-share";
import { ThumbsUp, Facebook, MessageCircle, Youtube } from "lucide-react";

interface PerfectMatchCardProps {
  movie: Movie;
  insights: PerfectMatchInsights;
  isDark: boolean;
}

function getPlatformStyle(platform: string) {
  const approvedPlatform = Object.entries(APPROVED_PLATFORMS).find(([name, data]) =>
    data.matches.includes(platform) || name === platform
  );

  return approvedPlatform
    ? { name: approvedPlatform[0], ...approvedPlatform[1] }
    : null;
}

export function PerfectMatchCard({ movie, insights, isDark }: PerfectMatchCardProps) {
  const shareUrl = window.location.href;

  return (
    <div
      className={cn(
        "w-full rounded-lg border p-6 sm:p-8",
        isDark ? "bg-[#0A1A3F] border-blue-900/30" : "bg-white border-gray-200"
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image du film */}
        <div className="w-full">
          <div className="aspect-[2/3] w-full rounded-xl overflow-hidden">
            <img
              src={movie.imageUrl || FALLBACK_IMAGE}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Description du film */}
        <div className="md:col-span-2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
          <p className="text-sm text-gray-300 mb-1">
            {movie.year} • {movie.duration} min • ⭐ {movie.rating}
          </p>
          <p className="text-sm text-gray-400 mb-2">{movie.language}</p>

          <div className="mb-3">
            <p className="text-sm font-semibold text-white mb-1">Available on</p>
            <div className="flex flex-wrap gap-2">
              {movie.streamingPlatforms.map((platform) => {
                const style = getPlatformStyle(platform);
                return style ? (
                  <a
                    key={platform}
                    href={PLATFORM_SEARCH_URLS[style.name] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      isDark ? style.darkBg : style.lightBg,
                      isDark ? style.darkText : style.lightText
                    )}
                  >
                    {style.label}
                  </a>
                ) : null;
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="bg-white/10 text-white text-xs px-2 py-1 rounded"
              >
                {genre}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-300 whitespace-pre-line mb-4">
            {movie.description || "No description available"}
          </p>

          <div className="mb-4">
            <Button className="flex items-center gap-2 text-sm">
              <Youtube className="w-4 h-4" /> Watch Trailer
            </Button>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Share your perfect match</p>
            <div className="flex gap-3">
              <FacebookShareButton url={shareUrl}><Facebook className="text-blue-500" /></FacebookShareButton>
              <TwitterShareButton url={shareUrl}><MessageCircle className="text-black" /></TwitterShareButton>
              <WhatsappShareButton url={shareUrl}><ThumbsUp className="text-green-500" /></WhatsappShareButton>
            </div>
          </div>
        </div>
      </div>

      {/* You Might Also Like */}
      <div className="mt-8">
        <h4 className="text-md font-semibold mb-4 text-white">You Might Also Like</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {insights.similar.map((movie) => (
            <div key={`suggestion-${movie.id}`}>
              {/* réutilise MovieCard si possible */}
              <div className="rounded-lg overflow-hidden bg-[#101e3c] p-4">
                <h5 className="text-sm font-semibold text-white mb-1">{movie.title}</h5>
                <p className="text-xs text-gray-300">{movie.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
