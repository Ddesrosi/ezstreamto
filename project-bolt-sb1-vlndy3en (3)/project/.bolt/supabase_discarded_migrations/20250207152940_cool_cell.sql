/*
  # Initial Database Schema

  1. Tables
    - movies: Store movie information and cache TMDB results
    - ip_searches: Track search limits by IP
    - supporters: Store premium user information
    - deepseek_cache: Cache recommendation results

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- Movies table for caching TMDB results
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id text UNIQUE NOT NULL,
  title text NOT NULL,
  year integer,
  poster_path text,
  backdrop_path text,
  youtube_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- IP Searches table for tracking search limits
CREATE TABLE IF NOT EXISTS ip_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  search_count int DEFAULT 0,
  last_search timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Supporters table for premium users
CREATE TABLE IF NOT EXISTS supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  transaction_id text NOT NULL,
  verified boolean DEFAULT false,
  unlimited_searches boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Deepseek cache table for storing recommendation results
CREATE TABLE IF NOT EXISTS deepseek_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preferences_hash text UNIQUE NOT NULL,
  is_premium boolean DEFAULT false,
  premium_features_used boolean DEFAULT false,
  results jsonb NOT NULL,
  perfect_match jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE deepseek_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow public read access to movies"
  ON movies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage movies"
  ON movies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage ip_searches"
  ON ip_searches FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage supporters"
  ON supporters FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage deepseek_cache"
  ON deepseek_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for movies table
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM deepseek_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to get cached results
CREATE OR REPLACE FUNCTION get_cached_results(p_hash text)
RETURNS TABLE (
  results jsonb,
  perfect_match jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT dc.results, dc.perfect_match
  FROM deepseek_cache dc
  WHERE dc.preferences_hash = p_hash
    AND dc.expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to store cache results
CREATE OR REPLACE FUNCTION store_cache_result(
  p_hash text,
  p_results jsonb,
  p_perfect_match jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO deepseek_cache (preferences_hash, results, perfect_match)
  VALUES (p_hash, p_results, p_perfect_match)
  ON CONFLICT (preferences_hash)
  DO UPDATE SET
    results = EXCLUDED.results,
    perfect_match = EXCLUDED.perfect_match,
    expires_at = now() + interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;