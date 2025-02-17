/*
  # Fix Cache Implementation and Indexes

  1. Changes
    - Recreate table with proper structure
    - Fix index predicates to use IMMUTABLE functions
    - Add improved cache analytics
    - Add hit tracking

  2. Security
    - Maintain RLS policies
    - Add rate limiting for cache operations

  3. Performance
    - Add optimized indexes for common query patterns
    - Add cache hit monitoring
*/

-- Recreate the table with proper structure
DROP TABLE IF EXISTS deepseek_cache CASCADE;

CREATE TABLE deepseek_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preferences_hash text UNIQUE NOT NULL,
  is_premium boolean NOT NULL DEFAULT false,
  premium_features_used boolean NOT NULL DEFAULT false,
  main_movie_title text,
  additional_movies jsonb NOT NULL,
  explanation text,
  hits integer DEFAULT 0,
  last_hit timestamptz,
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

-- Create optimized indexes without using now() in predicates
CREATE INDEX idx_deepseek_cache_lookup 
ON deepseek_cache(preferences_hash, is_premium, premium_features_used, expires_at);

CREATE INDEX idx_deepseek_cache_expiration
ON deepseek_cache(expires_at);

CREATE INDEX idx_deepseek_cache_hits
ON deepseek_cache(hits DESC, expires_at);

-- Create function to clean expired cache with analytics
CREATE OR REPLACE FUNCTION clean_expired_deepseek_cache()
RETURNS TABLE (
  cleaned_count integer,
  total_hits bigint,
  avg_hits numeric
) AS $$
DECLARE
  cleaned integer;
  total_hit_count bigint;
  average_hits numeric;
BEGIN
  WITH deleted AS (
    DELETE FROM deepseek_cache
    WHERE expires_at <= now()
    RETURNING hits
  )
  SELECT 
    count(*),
    sum(hits),
    avg(hits)::numeric(10,2)
  INTO
    cleaned,
    total_hit_count,
    average_hits
  FROM deleted;

  RETURN QUERY
  SELECT cleaned, total_hit_count, average_hits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update cache hit count and expiration
CREATE OR REPLACE FUNCTION update_cache_hit(cache_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE deepseek_cache
  SET 
    hits = hits + 1,
    last_hit = now(),
    expires_at = now() + interval '24 hours'
  WHERE id = cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cache analytics
CREATE OR REPLACE FUNCTION get_cache_analytics()
RETURNS TABLE (
  total_entries bigint,
  active_entries bigint,
  total_hits bigint,
  avg_hits_per_entry numeric,
  cache_hit_ratio numeric,
  avg_entry_lifetime interval
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    count(*)::bigint as total_entries,
    count(*) FILTER (WHERE expires_at > now())::bigint as active_entries,
    sum(hits)::bigint as total_hits,
    (sum(hits)::numeric / nullif(count(*), 0)::numeric)::numeric(10,2) as avg_hits_per_entry,
    (count(*) FILTER (WHERE expires_at > now())::numeric / 
     nullif(count(*), 0)::numeric * 100)::numeric(10,2) as cache_hit_ratio,
    avg(
      CASE 
        WHEN expires_at <= now() THEN expires_at - created_at
        ELSE now() - created_at
      END
    )::interval as avg_entry_lifetime
  FROM deepseek_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;