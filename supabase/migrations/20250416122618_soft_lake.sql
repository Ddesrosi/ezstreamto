/*
  # Fix BMC Support Integration

  1. Changes
    - Add unique constraint on transaction_id
    - Add support_status for tracking verification state
    - Add support_date for tracking when support was received
    - Add function to check premium status by email or IP

  2. Security
    - Maintain existing RLS policies
    - Add validation functions for premium status
*/

-- Add new columns for better support tracking
ALTER TABLE supporters
ADD COLUMN IF NOT EXISTS support_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS support_date timestamptz DEFAULT now();

-- Add unique constraint on transaction_id
ALTER TABLE supporters
ADD CONSTRAINT unique_transaction_id UNIQUE (transaction_id);

-- Create function to check premium status
CREATE OR REPLACE FUNCTION check_premium_status(p_email text, p_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM supporters
    WHERE (
      (email = p_email AND email IS NOT NULL) OR
      (ip_address = p_ip AND ip_address IS NOT NULL)
    )
    AND verified = true
    AND unlimited_searches = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;