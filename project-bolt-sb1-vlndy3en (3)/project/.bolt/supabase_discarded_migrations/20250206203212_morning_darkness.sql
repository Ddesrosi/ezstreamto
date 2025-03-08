/*
  # Check and Fix DeepSeek Cache Table
  
  1. Safely check if table exists
  2. Create if missing
  3. Add missing columns if needed
*/

DO $$ 
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'deepseek_cache'
  ) THEN
    -- Create table if it doesn't exist
    CREATE TABLE public.deepseek_cache (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      preferences_hash text UNIQUE NOT NULL,
      is_premium boolean NOT NULL DEFAULT false,
      premium_features_used boolean NOT NULL DEFAULT false,
      main_movie_title text,
      additional_movies jsonb NOT NULL,
      explanation text,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
      last_accessed timestamptz,
      hit_count integer DEFAULT 0
    );

    -- Enable RLS
    ALTER TABLE public.deepseek_cache ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow public read access to cache"
      ON public.deepseek_cache
      FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Allow service role to manage cache"
      ON public.deepseek_cache
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Create safe indexes
    CREATE INDEX IF NOT EXISTS idx_deepseek_cache_lookup 
    ON public.deepseek_cache(preferences_hash, is_premium, premium_features_used, expires_at);

    CREATE INDEX IF NOT EXISTS idx_deepseek_cache_expiration
    ON public.deepseek_cache(expires_at);
  END IF;

  -- Add missing columns if needed
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'deepseek_cache' 
      AND column_name = 'last_accessed'
    ) THEN
      ALTER TABLE public.deepseek_cache 
      ADD COLUMN last_accessed timestamptz;
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'deepseek_cache' 
      AND column_name = 'hit_count'
    ) THEN
      ALTER TABLE public.deepseek_cache 
      ADD COLUMN hit_count integer DEFAULT 0;
    END IF;
  END $$;
END $$;