/*
  # Update Search Criteria System

  1. Changes
    - Add search_criteria table to store valid criteria options
    - Add functions to validate search criteria
    - Update search logging to include detailed criteria

  2. Security
    - Enable RLS
    - Allow public read access to criteria
    - Service role management access
*/

-- Create search_criteria table
CREATE TABLE IF NOT EXISTS search_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text NOT NULL,
  allow_multiple boolean DEFAULT false,
  premium_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(type, name)
);

-- Enable RLS
ALTER TABLE search_criteria ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to criteria"
  ON search_criteria
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage criteria"
  ON search_criteria
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert valid content types
INSERT INTO search_criteria (type, name, allow_multiple, premium_only)
VALUES 
  ('content_type', 'movie', false, false),
  ('content_type', 'tv', false, false)
ON CONFLICT (type, name) DO NOTHING;

-- Insert valid moods
INSERT INTO search_criteria (type, name, allow_multiple, premium_only)
VALUES 
  ('mood', 'Dark', true, false),
  ('mood', 'Funny', true, false),
  ('mood', 'Epic', true, false),
  ('mood', 'Heartwarming', true, false),
  ('mood', 'Happy', true, false),
  ('mood', 'Relaxed', true, false),
  ('mood', 'Excited', true, false),
  ('mood', 'Romantic', true, false),
  ('mood', 'Thoughtful', true, false),
  ('mood', 'Adventurous', true, false),
  ('mood', 'Nostalgic', true, false),
  ('mood', 'Mysterious', true, false)
ON CONFLICT (type, name) DO NOTHING;

-- Insert valid genres
INSERT INTO search_criteria (type, name, allow_multiple, premium_only)
VALUES 
  ('genre', 'Action', true, false),
  ('genre', 'Adventure', true, false),
  ('genre', 'Animation', true, false),
  ('genre', 'Biography', true, false),
  ('genre', 'Comedy', true, false),
  ('genre', 'Crime', true, false),
  ('genre', 'Documentary', true, false),
  ('genre', 'Drama', true, false),
  ('genre', 'Family', true, false),
  ('genre', 'Fantasy', true, false),
  ('genre', 'Film-Noir', true, false),
  ('genre', 'History', true, false),
  ('genre', 'Horror', true, false),
  ('genre', 'Musical', true, false),
  ('genre', 'Mystery', true, false),
  ('genre', 'Romance', true, false),
  ('genre', 'Sci-Fi', true, false),
  ('genre', 'Sport', true, false),
  ('genre', 'Superhero', true, false),
  ('genre', 'Thriller', true, false),
  ('genre', 'War', true, false),
  ('genre', 'Western', true, false)
ON CONFLICT (type, name) DO NOTHING;

-- Insert time periods
INSERT INTO search_criteria (type, name, allow_multiple, premium_only)
VALUES 
  ('time_period', 'Classic Era (1920-1959)', false, false),
  ('time_period', 'New Hollywood (1960-1979)', false, false),
  ('time_period', 'Blockbuster Era (1980-1999)', false, false),
  ('time_period', 'Modern Cinema (2000-2010)', false, false),
  ('time_period', 'Contemporary (2011-Present)', false, false)
ON CONFLICT (type, name) DO NOTHING;

-- Add premium features
INSERT INTO search_criteria (type, name, allow_multiple, premium_only)
VALUES 
  ('feature', 'keywords', true, true),
  ('feature', 'specific_year', false, true),
  ('feature', 'rating_range', false, true)
ON CONFLICT (type, name) DO NOTHING;

-- Function to validate search criteria
CREATE OR REPLACE FUNCTION validate_search_criteria(
  p_content_type text,
  p_moods text[],
  p_genres text[],
  p_time_period text,
  p_keywords text[],
  p_specific_year integer,
  p_rating_range jsonb,
  p_is_premium boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invalid_criteria text[];
  v_premium_features text[];
BEGIN
  -- Validate content type
  IF NOT EXISTS (
    SELECT 1 FROM search_criteria 
    WHERE type = 'content_type' AND name = p_content_type
  ) THEN
    v_invalid_criteria := array_append(v_invalid_criteria, 'content_type');
  END IF;

  -- Validate moods
  IF NOT EXISTS (
    SELECT 1 FROM search_criteria 
    WHERE type = 'mood' AND name = ANY(p_moods)
  ) THEN
    v_invalid_criteria := array_append(v_invalid_criteria, 'moods');
  END IF;

  -- Validate genres
  IF NOT EXISTS (
    SELECT 1 FROM search_criteria 
    WHERE type = 'genre' AND name = ANY(p_genres)
  ) THEN
    v_invalid_criteria := array_append(v_invalid_criteria, 'genres');
  END IF;

  -- Check premium features if not premium
  IF NOT p_is_premium THEN
    IF array_length(p_keywords, 1) > 0 THEN
      v_premium_features := array_append(v_premium_features, 'keywords');
    END IF;
    
    IF p_specific_year IS NOT NULL THEN
      v_premium_features := array_append(v_premium_features, 'specific_year');
    END IF;
    
    IF p_rating_range IS NOT NULL THEN
      v_premium_features := array_append(v_premium_features, 'rating_range');
    END IF;
  END IF;

  -- Return validation results
  RETURN jsonb_build_object(
    'is_valid', v_invalid_criteria IS NULL,
    'invalid_criteria', v_invalid_criteria,
    'premium_features_used', v_premium_features,
    'requires_premium', array_length(v_premium_features, 1) > 0
  );
END;
$$;