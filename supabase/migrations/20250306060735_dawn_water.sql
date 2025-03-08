/*
  # Search Logging System

  1. Tables
    - `search_logs`: Tracks all search attempts
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `search_count` (integer)
      - `last_search` (timestamptz)
      - `preferences` (jsonb)
      - `result_count` (integer)
      - `created_at` (timestamptz)
      - `success` (boolean)
      - `error_message` (text)

  2. Security
    - Enable RLS
    - Add policies for search logging
    - Add function to validate and log searches
*/

-- Create search_logs table
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  search_count integer DEFAULT 1,
  last_search timestamptz DEFAULT now(),
  preferences jsonb DEFAULT '{}',
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text,
  CONSTRAINT search_logs_ip_idx UNIQUE (ip_address)
);

-- Enable RLS
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting logs
CREATE POLICY "Enable insert for all users"
  ON search_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for reading logs
CREATE POLICY "Enable read access for all users"
  ON search_logs
  FOR SELECT
  TO public
  USING (true);

-- Function to validate and log search
CREATE OR REPLACE FUNCTION validate_and_log_search(
  p_ip_address text,
  p_preferences jsonb DEFAULT '{}'::jsonb,
  p_result_count integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit integer := 5;
  v_search_record search_logs%ROWTYPE;
  v_response jsonb;
BEGIN
  -- Get existing record for IP
  SELECT * INTO v_search_record
  FROM search_logs
  WHERE ip_address = p_ip_address;

  -- Check if this is first search or new day
  IF v_search_record IS NULL OR 
     v_search_record.last_search::date < current_date THEN
    -- Insert new record or reset count for new day
    INSERT INTO search_logs (
      ip_address, 
      preferences,
      result_count,
      search_count,
      last_search
    )
    VALUES (
      p_ip_address,
      p_preferences,
      p_result_count,
      1,
      now()
    )
    ON CONFLICT (ip_address) 
    DO UPDATE SET
      search_count = 1,
      last_search = now(),
      preferences = p_preferences,
      result_count = p_result_count;

    v_response := jsonb_build_object(
      'status', 'success',
      'remaining', v_daily_limit - 1,
      'total', v_daily_limit,
      'canSearch', true
    );
  ELSE
    -- Check if limit reached
    IF v_search_record.search_count >= v_daily_limit THEN
      v_response := jsonb_build_object(
        'status', 'limit_reached',
        'remaining', 0,
        'total', v_daily_limit,
        'canSearch', false,
        'message', 'Daily search limit reached. Support us to get unlimited searches!'
      );
    ELSE
      -- Increment search count
      UPDATE search_logs SET
        search_count = search_count + 1,
        last_search = now(),
        preferences = p_preferences,
        result_count = p_result_count
      WHERE ip_address = p_ip_address;

      v_response := jsonb_build_object(
        'status', 'success',
        'remaining', v_daily_limit - (v_search_record.search_count + 1),
        'total', v_daily_limit,
        'canSearch', true
      );
    END IF;
  END IF;

  RETURN v_response;
END;
$$;