/*
  # Add Premium Users Support

  1. New Tables
    - `premium_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subscription_type` (text)
      - `starts_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `premium_users` table
    - Add policies for authenticated users to read their own data
    - Add policy for service role to manage all data
*/

CREATE TABLE IF NOT EXISTS premium_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subscription_type text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own premium status"
  ON premium_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage premium users"
  ON premium_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to check if a user is premium
CREATE OR REPLACE FUNCTION is_user_premium(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM premium_users
    WHERE user_id = user_uuid
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;