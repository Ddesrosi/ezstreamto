/*
  # Add unlimited searches to supporters table

  1. Changes
    - Add unlimited_searches boolean column to supporters table
    - Set default value to true for all supporters
    - Update existing supporters to have unlimited searches

  2. Security
    - Maintain existing RLS policies
*/

-- Add unlimited_searches column
ALTER TABLE supporters 
ADD COLUMN IF NOT EXISTS unlimited_searches boolean DEFAULT true;

-- Update existing supporters to have unlimited searches
UPDATE supporters 
SET unlimited_searches = true 
WHERE unlimited_searches IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_supporters_unlimited_searches 
ON supporters(unlimited_searches) 
WHERE unlimited_searches = true;