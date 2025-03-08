-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Movies policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'movies' 
        AND policyname = 'Allow public read access'
    ) THEN
        DROP POLICY "Allow public read access" ON movies;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'movies' 
        AND policyname = 'Allow service role to manage movies'
    ) THEN
        DROP POLICY "Allow service role to manage movies" ON movies;
    END IF;

    -- IP searches policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'ip_searches' 
        AND policyname = 'Allow service role to manage ip_searches'
    ) THEN
        DROP POLICY "Allow service role to manage ip_searches" ON ip_searches;
    END IF;

    -- Supporters policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'supporters' 
        AND policyname = 'Allow service role to manage supporters'
    ) THEN
        DROP POLICY "Allow service role to manage supporters" ON supporters;
    END IF;
END $$;

-- Create policies
CREATE POLICY "Allow public read access"
  ON movies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage movies"
  ON movies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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