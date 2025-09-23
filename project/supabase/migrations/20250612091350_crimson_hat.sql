/*
  # Fix visits table RLS policy

  1. Security Changes
    - Update RLS policy on `visits` table to allow anonymous users to create visits
    - Allow both authenticated and anonymous users to read and write visits
    - Remove the area_id requirement for visits since house visits don't need to be tied to specific areas

  2. Policy Updates
    - Replace restrictive policy with more permissive one for campaign data collection
    - Allow INSERT, SELECT, UPDATE, DELETE for both authenticated and anon roles
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Temporary allow all visits access" ON visits;

-- Create new policies that allow both authenticated and anonymous users
CREATE POLICY "Allow anonymous and authenticated users to read visits"
  ON visits
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anonymous and authenticated users to create visits"
  ON visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to update visits"
  ON visits
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete visits"
  ON visits
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Make area_id nullable since house visits don't always need to be tied to specific areas
-- This is already nullable in the schema, but let's ensure the constraint allows it
DO $$
BEGIN
  -- Check if we need to modify the area_id constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'visits' 
    AND constraint_name = 'visits_area_id_fkey'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Drop and recreate the foreign key constraint to allow NULL values
    ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_area_id_fkey;
    ALTER TABLE visits ADD CONSTRAINT visits_area_id_fkey 
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE;
  END IF;
END $$;