/*
  # Consolidate Deepseek Cache Implementation

  1. New Tables
    - `deepseek_cache`
      - `id` (uuid, primary key)
      - `preferences_hash` (text, unique)
      - `is_premium` (boolean)
      - `premium_features_used` (boolean)
      - `main_movie_title` (text, nullable)
      - `additional_movies` (jsonb)
      - `explanation` (text, nullable)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on `deepseek_cache` table
    - Add policy for public read access to non-expired cache
    - Add policy for service role management

  3. Performance
    - Add composite index for efficient cache lookups
    - Add index on expiration for cleanup
    - Add cache hit ratio monitoring

  4. Maintenance
    - Add function to clean expired cache entries
    - Add function to update cache expiration
    - Add function to monitor cache performance
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS deepseek_cache CASCADE;

-- Create deepseek_cache table
CREATE TABLE deepseek_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preferences_hash text UNIQUE NOT NULL,
  is_premium boolean NOT NULL DEFAULT false,
  premium_features_used boolean NOT NULL DEFAULT false,
  main_movie_title text,
  additional_movies jsonb NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE deepseek_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to cache"
  ON deepseek_cache
  FOR SELECT
  TO public
  USING (expires_at > now());

CREATE POLICY "Allow service role to manage cache"
  ON deepseek_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_deepseek_cache_lookup 
ON deepseek_cache(preferences_hash, is_premium, premium_features_used)
WHERE expires_at > now();

CREATE INDEX idx_deepseek_cache_expiration
ON deepseek_cache(expires_at)
WHERE expires_at <= now();

-- Create function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_deepseek_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM deepseek_cache
  WHERE expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update cache expiration
CREATE OR REPLACE FUNCTION update_cache_expiration(cache_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE deepseek_cache
  SET expires_at = now() + interval '24 hours'
  WHERE id = cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cache hit ratio
CREATE OR REPLACE FUNCTION get_cache_hit_ratio()
RETURNS TABLE (
  total_requests bigint,
  cache_hits bigint,
  hit_ratio numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    count(*) as total_requests,
    count(*) FILTER (WHERE expires_at > now()) as cache_hits,
    ROUND(
      (count(*) FILTER (WHERE expires_at > now()))::numeric / 
      NULLIF(count(*), 0)::numeric * 100,
      2
    ) as hit_ratio
  FROM deepseek_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;