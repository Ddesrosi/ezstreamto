/*
  # Search Logging System Setup

  1. Tables
    - `ip_searches`: Tracks search activity by IP
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `search_count` (integer)
      - `last_search` (timestamptz)
      - `filters` (jsonb)
      - `result_count` (integer)
      - `created_at` (timestamptz)

    - `search_logs`: Detailed search history
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `preferences` (jsonb)
      - `result_count` (integer)
      - `created_at` (timestamptz)

  2. Functions
    - `validate_and_log_search`: RPC function to validate and log searches
    
  3. Security
    - Enable RLS
    - Add policies for search logging
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
  UNIQUE(ip_address)
);

-- Create search_logs table for detailed history
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  preferences jsonb DEFAULT '{}',
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for all users on ip_searches"
  ON ip_searches
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable insert for all users on search_logs"
  ON search_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to validate and log searches
CREATE OR REPLACE FUNCTION validate_and_log_search(
  p_ip_address text,
  p_preferences jsonb DEFAULT '{}',
  p_result_count integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search_count integer;
  v_last_search timestamptz;
  v_daily_limit integer := 5;
  v_premium_limit integer := 100;
  v_is_premium boolean := false;
BEGIN
  -- Get or create search record
  INSERT INTO ip_searches (ip_address, search_count, last_search)
  VALUES (p_ip_address, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
  SET search_count = 
    CASE 
      WHEN (ip_searches.last_search::date != now()::date) THEN 1
      ELSE ip_searches.search_count + 1
    END,
    last_search = now()
  RETURNING search_count, last_search
  INTO v_search_count, v_last_search;

  -- Log detailed search
  INSERT INTO search_logs (ip_address, preferences, result_count)
  VALUES (p_ip_address, p_preferences, p_result_count);

  -- Return search status
  RETURN jsonb_build_object(
    'status', 'ok',
    'canSearch', true,
    'remaining', v_daily_limit - v_search_count,
    'total', v_daily_limit,
    'timestamp', v_last_search
  );
END;
$$;