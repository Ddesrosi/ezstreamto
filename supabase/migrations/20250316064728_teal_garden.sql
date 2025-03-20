/*
  # Fix IP Searches RLS Policies

  1. Changes
    - Drop existing RLS policies for ip_searches
    - Create new policies allowing public access for insert/select
    - Enable RLS on table
    
  2. Security
    - Allow public insert access for tracking searches
    - Allow public select access for viewing search counts
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'ip_searches'
    ) THEN
        DROP POLICY IF EXISTS "Enable insert for all users" ON ip_searches;
        DROP POLICY IF EXISTS "Enable read access for all users" ON ip_searches;
        DROP POLICY IF EXISTS "Allow service role to manage ip_searches" ON ip_searches;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE ip_searches ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow public insert access"
    ON ip_searches
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public select access"
    ON ip_searches
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow service role full access"
    ON ip_searches
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);