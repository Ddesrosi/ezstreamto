/*
  # Create movies table for caching TMDB data

  1. New Tables
    - `movies`
      - `id` (uuid, primary key)
      - `tmdb_id` (text, unique)
      - `title` (text)
      - `year` (integer)
      - `poster_path` (text)
      - `backdrop_path` (text)
      - `youtube_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `movies` table
    - Add policy for authenticated users to read movies
    - Add policy for service role to manage movies
*/

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

-- Enable RLS
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();