/*
  # Fix Search Logging System

  1. Tables
    - `ip_searches`: Tracks search activity by IP
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `search_count` (integer)
      - `last_search` (timestamptz)
      - `filters` (jsonb)
      - `result_count` (integer)
      - `created_at` (timestamptz)
*/

-- Create ip_searches table if not exists
CREATE TABLE IF NOT EXISTS ip_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  search_count integer DEFAULT 1,
  last_search timestamptz DEFAULT now(),
  filters jsonb DEFAULT '{}',
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting
CREATE POLICY "Enable insert for all users on ip_searches"
  ON ip_searches
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for selecting
CREATE POLICY "Enable select for all users on ip_searches"
  ON ip_searches
  FOR SELECT
  TO public
  USING (true);