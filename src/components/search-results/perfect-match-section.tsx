import { PerfectMatchCard } from './perfect-match-card';
import { MovieCard } from './movie-card';
import { Movie } from '@/types';
import type { PerfectMatchInsights } from '@/lib/perfect-match';

interface PerfectMatchSectionProps {
  perfectMatch: {
    main: Movie;
    insights: PerfectMatchInsights;
  };
  isDark: boolean;
}

export function PerfectMatchSection({ perfectMatch, isDark }: PerfectMatchSectionProps) {
  return (
    <div className="my-6">
      <PerfectMatchCard
        movie={perfectMatch.main}
        insights={perfectMatch.insights}
        isDark={isDark}
      />

      <h4 className="text-md font-semibold mt-6 mb-2">
        You Might Also Like
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {perfectMatch.insights.similar.map((movie) => (
          <MovieCard key={`suggestion-${movie.id}`} movie={movie} isDark={isDark} />
        ))}
      </div>
    </div>
  );
}
