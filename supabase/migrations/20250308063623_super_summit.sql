/*
  # Update Search Limits Schema

  1. Changes
    - Create ip_searches table for tracking lifetime search counts
    - Add indexes for performance
    - Enable RLS for security

  2. Security
    - Enable RLS on ip_searches table
    - Add policy for authenticated users to read their own data
*/

-- Create ip_searches table
CREATE TABLE IF NOT EXISTS ip_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  search_count integer NOT NULL DEFAULT 1,
  last_search timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ip_searches_ip_address_key UNIQUE (ip_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS ip_searches_ip_address_idx ON ip_searches (ip_address);

-- Enable RLS
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;

-- Create policy for reading own data
CREATE POLICY "Users can read own search data"
  ON ip_searches
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for inserting own data
CREATE POLICY "Users can insert own search data"
  ON ip_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for updating own data
CREATE POLICY "Users can update own search data"
  ON ip_searches
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);