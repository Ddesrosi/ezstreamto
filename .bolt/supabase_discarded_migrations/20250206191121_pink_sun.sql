/*
  # Fix DeepSeek Cache Indexes

  1. Changes
    - Remove non-IMMUTABLE function calls from index predicates
    - Create simple B-tree indexes for better performance
    - Add composite indexes for common query patterns
    - Add cache hit tracking

  2. Security
    - Maintain existing RLS policies
    - Keep SECURITY DEFINER functions

  3. Performance
    - Optimize index structure for common queries
    - Add better cache hit tracking
*/

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_deepseek_cache_lookup;
DROP INDEX IF EXISTS idx_deepseek_cache_expiration;
DROP INDEX IF EXISTS idx_deepseek_cache_hits;
DROP INDEX IF EXISTS idx_deepseek_cache_analytics;

-- Create new optimized indexes without function calls in predicates
CREATE INDEX idx_deepseek_cache_lookup 
ON deepseek_cache(preferences_hash, is_premium, premium_features_used, expires_at);

CREATE INDEX idx_deepseek_cache_expiration
ON deepseek_cache(expires_at);

CREATE INDEX idx_deepseek_cache_hits
ON deepseek_cache(hits DESC, expires_at);

CREATE INDEX idx_deepseek_cache_analytics
ON deepseek_cache(created_at, last_hit, expires_at);

-- Add function to analyze cache performance
CREATE OR REPLACE FUNCTION analyze_cache_performance(
  time_window interval DEFAULT interval '24 hours'
)
RETURNS TABLE (
  cache_hits bigint,
  cache_misses bigint,
  hit_ratio numeric,
  avg_hit_count numeric,
  avg_cache_lifetime interval
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      count(*) FILTER (WHERE hits > 0) as hits,
      count(*) FILTER (WHERE hits = 0) as misses,
      avg(hits)::numeric(10,2) as avg_hits,
      avg(
        CASE 
          WHEN expires_at <= current_timestamp THEN expires_at - created_at
          ELSE current_timestamp - created_at
        END
      ) as avg_lifetime
    FROM deepseek_cache
    WHERE created_at >= current_timestamp - time_window
  )
  SELECT
    hits as cache_hits,
    misses as cache_misses,
    round((hits::numeric / nullif(hits + misses, 0) * 100)::numeric, 2) as hit_ratio,
    avg_hits as avg_hit_count,
    avg_lifetime as avg_cache_lifetime
  FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;