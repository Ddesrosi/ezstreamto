import { PerfectMatchCard } from './perfect-match-card';
import { MovieCard } from './movie-card';
import { Movie } from '@/types';
import type { PerfectMatchInsights } from '@/lib/perfect-match';

interface PerfectMatchSectionProps {
  movie: Movie;
  insights: PerfectMatchInsights;
  isDark: boolean;
}

export function PerfectMatchSection({ movie, insights, isDark }: PerfectMatchSectionProps) {
  return (
    <div className="my-6 space-y-6">
      <PerfectMatchCard
        movie={movie}
        insights={insights}
        isDark={isDark}
      />
    </div>
  );
}
