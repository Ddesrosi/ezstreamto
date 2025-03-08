/*
  # Movies Table Schema Update

  1. Changes
    - Drop existing policies if they exist
    - Create movies table with indices
    - Set up RLS and policies
    - Add updated_at trigger

  2. Security
    - Enable RLS
    - Public read access
    - Service role management access
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
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
END $$;

-- Create movies table if it doesn't exist
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

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);