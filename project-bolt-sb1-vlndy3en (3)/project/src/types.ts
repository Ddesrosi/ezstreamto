export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: number | string | null;
  language: string;
  genres: string[];
  description: string;
  imageUrl: string;
  backdropUrl?: string;
  youtubeUrl?: string;
  streamingPlatforms: string[];
  director?: string[];
  stars?: string[];
  trailer?: string;
}