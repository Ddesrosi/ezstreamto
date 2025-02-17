/*
  # Initialize Movie Database Schema

  1. Tables
    - Ensure tables exist with proper structure
    - Add necessary columns and constraints
  
  2. Security
    - Enable RLS on all tables
    - Add policies if they don't exist
  
  3. Functions
    - Add utility functions for maintenance
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Movies policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'movies' 
        AND policyname = 'Allow public read access'
    ) THEN
        DROP POLICY "Allow public read access" ON movies;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'movies' 
        AND policyname = 'Allow service role to manage movies'
    ) THEN
        DROP POLICY "Allow service role to manage movies" ON movies;
    END IF;

    -- IP searches policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'ip_searches' 
        AND policyname = 'Allow service role to manage ip_searches'
    ) THEN
        DROP POLICY "Allow service role to manage ip_searches" ON ip_searches;
    END IF;

    -- Supporters policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'supporters' 
        AND policyname = 'Allow service role to manage supporters'
    ) THEN
        DROP POLICY "Allow service role to manage supporters" ON supporters;
    END IF;
END $$;

-- Movies table
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

-- IP Searches table
CREATE TABLE IF NOT EXISTS ip_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  search_count int DEFAULT 0,
  last_search timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Supporters table
CREATE TABLE IF NOT EXISTS supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  transaction_id text NOT NULL,
  verified boolean DEFAULT false,
  unlimited_searches boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON movies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage movies"
  ON movies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage ip_searches"
  ON ip_searches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage supporters"
  ON supporters
  FOR ALL
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

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to reset search counts daily
CREATE OR REPLACE FUNCTION reset_daily_searches()
RETURNS void AS $$
BEGIN
  UPDATE ip_searches
  SET search_count = 0
  WHERE DATE(last_search) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;