import { Film, Star, Clock, Globe, Youtube } from 'lucide-react';

interface SkeletonProps {
  count?: number;
  isDark?: boolean;
}

export function MovieSkeleton({ count = 6, isDark = false }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${
            isDark
              ? 'bg-[#0A1A3F] border-blue-900/30'
              : 'bg-white border-gray-200'
          } rounded-lg border overflow-hidden animate-pulse`}
        >
          {/* Poster Skeleton */}
          <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {/* Title Skeleton */}
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="flex items-center gap-2">
                {/* Duration Skeleton */}
                <div className="h-3 bg-gray-700 rounded w-12" />
                {/* Year Skeleton */}
                <div className="h-3 bg-gray-700 rounded w-10" />
                {/* Rating Skeleton */}
                <div className="h-3 bg-gray-700 rounded w-8" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-3 space-y-3">
            {/* Language and Platforms Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-700 rounded w-16" />
              <div className="flex gap-1">
                <div className="h-4 bg-gray-700 rounded w-12" />
                <div className="h-4 bg-gray-700 rounded w-12" />
              </div>
            </div>

            {/* Genres Skeleton */}
            <div className="flex flex-wrap gap-1">
              <div className="h-4 bg-gray-700 rounded w-14" />
              <div className="h-4 bg-gray-700 rounded w-16" />
              <div className="h-4 bg-gray-700 rounded w-12" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-1">
              <div className="h-3 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-5/6" />
            </div>

            {/* Button Skeleton */}
            <div className="h-8 bg-gray-700 rounded w-full" />
          </div>
        </div>
      ))}
    </>
  );
}