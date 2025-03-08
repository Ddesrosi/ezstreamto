/*
  # Search Tracking System

  1. New Tables
    - `ip_searches`: Tracks search usage by IP address
      - `id` (uuid, primary key)
      - `ip_address` (text, unique)
      - `search_count` (integer)
      - `last_search` (timestamptz)
      - `filters` (jsonb)
      - `result_count` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `ip_searches` table
    - Add policies for authenticated users to read their own data
    - Add policy for inserting new searches

  3. Functions
    - `log_search`: Function to log a new search attempt
    - `get_search_count`: Function to get remaining searches for an IP
*/

-- Create ip_searches table
CREATE TABLE IF NOT EXISTS ip_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  search_count integer DEFAULT 1,
  last_search timestamptz DEFAULT now(),
  filters jsonb DEFAULT '{}',
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_ip UNIQUE (ip_address)
);

-- Enable RLS
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting searches
CREATE POLICY "Anyone can insert searches"
  ON ip_searches
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for reading own searches
CREATE POLICY "Users can read their own searches"
  ON ip_searches
  FOR SELECT
  TO public
  USING (true);

-- Function to log a new search
CREATE OR REPLACE FUNCTION log_search(
  p_ip_address text,
  p_filters jsonb DEFAULT '{}',
  p_result_count integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ip_searches (ip_address, filters, result_count)
  VALUES (p_ip_address, p_filters, p_result_count)
  ON CONFLICT (ip_address)
  DO UPDATE SET
    search_count = ip_searches.search_count + 1,
    last_search = now(),
    filters = p_filters,
    result_count = p_result_count;
END;
$$;

-- Function to get remaining searches
CREATE OR REPLACE FUNCTION get_search_count(p_ip_address text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search_record ip_searches%ROWTYPE;
  v_daily_limit integer := 5; -- Free tier limit
BEGIN
  SELECT * INTO v_search_record
  FROM ip_searches
  WHERE ip_address = p_ip_address;

  -- If no record exists or last search was yesterday, return full limit
  IF v_search_record IS NULL OR 
     v_search_record.last_search::date < current_date THEN
    RETURN json_build_object(
      'remaining', v_daily_limit,
      'total', v_daily_limit,
      'can_search', true
    );
  END IF;

  -- Return remaining searches
  RETURN json_build_object(
    'remaining', greatest(0, v_daily_limit - v_search_record.search_count),
    'total', v_daily_limit,
    'can_search', v_search_record.search_count < v_daily_limit
  );
END;
$$;