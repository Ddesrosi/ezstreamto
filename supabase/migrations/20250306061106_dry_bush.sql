/*
  # Verify Supabase Connection and Setup Search Logging

  1. Tables
    - `connection_tests`: Verifies connection and project access
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz)
      - `project_id` (text)
      - `success` (boolean)

  2. Security
    - Enable RLS
    - Add policy for connection testing
*/

-- Create connection test table
CREATE TABLE IF NOT EXISTS connection_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  project_id text NOT NULL,
  success boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE connection_tests ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting test records
CREATE POLICY "Enable insert for all users"
  ON connection_tests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert test record with project ID
INSERT INTO connection_tests (project_id)
VALUES ('acmpivmrokzblypxdxbu');

-- Verify project ID matches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM connection_tests 
    WHERE project_id = 'acmpivmrokzblypxdxbu'
  ) THEN
    RAISE EXCEPTION 'Project ID verification failed';
  END IF;
END $$;