/*
  # Cache System for Movie Recommendations

  1. New Tables
    - deepseek_cache
      - id (uuid, primary key)
      - preferences_hash (text, unique)
      - is_premium (boolean)
      - premium_features_used (boolean)
      - main_movie_title (text)
      - additional_movies (jsonb)
      - explanation (text)
      - created_at (timestamptz)
      - expires_at (timestamptz)

  2. Security
    - Enable RLS
    - Service role access only
*/

-- Create deepseek_cache table for storing recommendation results
CREATE TABLE IF NOT EXISTS deepseek_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preferences_hash text UNIQUE NOT NULL,
  is_premium boolean DEFAULT false,
  premium_features_used boolean DEFAULT false,
  main_movie_title text,
  additional_movies jsonb NOT NULL DEFAULT '[]',
  explanation text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Enable Row Level Security
ALTER TABLE deepseek_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow service role to manage deepseek_cache"
  ON deepseek_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM deepseek_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to update cache expiration
CREATE OR REPLACE FUNCTION update_cache_expiration(cache_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE deepseek_cache
  SET expires_at = now() + interval '24 hours'
  WHERE id = cache_id;
END;
$$ LANGUAGE plpgsql;

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_deepseek_cache_hash 
ON deepseek_cache(preferences_hash);

CREATE INDEX IF NOT EXISTS idx_deepseek_cache_expires 
ON deepseek_cache(expires_at);

-- Create index for premium content
CREATE INDEX IF NOT EXISTS idx_deepseek_cache_premium 
ON deepseek_cache(is_premium) 
WHERE is_premium = true;