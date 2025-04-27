/*
  # Add BMC Support Improvements

  1. Changes
    - Add email field to supporters table
    - Add amount field for tracking support level
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - Add validation functions
*/

-- Add new fields to supporters table
ALTER TABLE supporters
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS amount numeric(10,2),
ADD COLUMN IF NOT EXISTS support_type text DEFAULT 'bmc',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_supporters_email ON supporters(email);

-- Create function to validate supporter
CREATE OR REPLACE FUNCTION is_valid_supporter(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM supporters
    WHERE email = p_email
    AND verified = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;