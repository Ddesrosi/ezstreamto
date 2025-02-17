/*
  # Add Search Limits System

  1. New Tables
    - `ip_searches`: Track search counts per IP
      - `id` (uuid, primary key)
      - `ip_address` (text, unique)
      - `search_count` (int)
      - `last_search` (timestamp)
      - `created_at` (timestamp)
    
    - `supporters`: Track premium users
      - `id` (uuid, primary key)
      - `ip_address` (text, unique)
      - `transaction_id` (text)
      - `verified` (boolean)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for secure access
*/

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
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to reset search counts daily
CREATE OR REPLACE FUNCTION reset_daily_searches()
RETURNS void AS $$
BEGIN
  UPDATE ip_searches
  SET search_count = 0
  WHERE DATE(last_search) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;