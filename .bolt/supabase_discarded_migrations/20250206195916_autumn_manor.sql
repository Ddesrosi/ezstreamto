/*
  # DeepSeek Cache Implementation

  1. New Tables
    - `deepseek_cache`: Stores cached movie recommendations
      - Includes preferences hash, results, and expiration tracking
      - Optimized for quick lookups and efficient storage

  2. Security
    - Enable RLS for cache table
    - Policies for public read access and service role management

  3. Performance
    - Optimized indexes for common query patterns
    - Cache expiration tracking
    - No function calls in index predicates
*/

-- Create deepseek_cache table
CREATE TABLE IF NOT EXISTS deepseek_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preferences_hash text UNIQUE NOT NULL,
  is_premium boolean NOT NULL DEFAULT false,
  premium_features_used boolean NOT NULL DEFAULT false,
  main_movie_title text,
  additional_movies jsonb NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  last_accessed timestamptz,
  hit_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE deepseek_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to cache"
  ON deepseek_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage cache"
  ON deepseek_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
-- Note: No function calls in predicates to avoid 42P17 error
CREATE INDEX idx_deepseek_cache_lookup 
ON deepseek_cache(preferences_hash, is_premium, premium_features_used, expires_at);

CREATE INDEX idx_deepseek_cache_expiration
ON deepseek_cache(expires_at);

-- Create function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_deepseek_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM deepseek_cache
  WHERE expires_at <= current_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update cache hit
CREATE OR REPLACE FUNCTION update_cache_hit(cache_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE deepseek_cache
  SET 
    last_accessed = current_timestamp,
    hit_count = hit_count + 1,
    expires_at = current_timestamp + interval '24 hours'
  WHERE id = cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
  total_entries bigint,
  active_entries bigint,
  total_hits bigint,
  avg_hits_per_entry numeric,
  cache_size_bytes bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(*)::bigint as total_entries,
    count(*) FILTER (WHERE expires_at > current_timestamp)::bigint as active_entries,
    sum(hit_count)::bigint as total_hits,
    round(avg(hit_count)::numeric, 2) as avg_hits_per_entry,
    pg_total_relation_size('deepseek_cache'::regclass)::bigint as cache_size_bytes
  FROM deepseek_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;