/*
  # Complete Website Database Schema

  1. New Tables
    - user_preferences: Store user preferences
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - preferences (jsonb)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - search_history: Track user searches
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - search_query (jsonb)
      - results_count (integer)
      - created_at (timestamptz)

    - user_watchlist: Store user's saved movies
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - movie_id (uuid, references movies)
      - notes (text)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user data protection
*/

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  search_query jsonb NOT NULL,
  results_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User Watchlist Table
CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  movie_id uuid REFERENCES movies NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Search History Policies
CREATE POLICY "Users can view own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Watchlist Policies
CREATE POLICY "Users can view own watchlist"
  ON user_watchlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist"
  ON user_watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
ON search_history(user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_created_at 
ON search_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id 
ON user_watchlist(user_id);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_movie_id 
ON user_watchlist(movie_id);

-- Helper function to get user's recent searches
CREATE OR REPLACE FUNCTION get_recent_searches(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE (
  search_query jsonb,
  results_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT sh.search_query, sh.results_count, sh.created_at
  FROM search_history sh
  WHERE sh.user_id = p_user_id
  ORDER BY sh.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's watchlist with movie details
CREATE OR REPLACE FUNCTION get_user_watchlist(p_user_id uuid)
RETURNS TABLE (
  watchlist_id uuid,
  movie_id uuid,
  movie_title text,
  movie_year integer,
  poster_path text,
  notes text,
  added_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id as watchlist_id,
    m.id as movie_id,
    m.title as movie_title,
    m.year as movie_year,
    m.poster_path,
    uw.notes,
    uw.created_at as added_at
  FROM user_watchlist uw
  JOIN movies m ON m.id = uw.movie_id
  WHERE uw.user_id = p_user_id
  ORDER BY uw.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;