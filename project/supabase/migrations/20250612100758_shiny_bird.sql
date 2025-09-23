/*
  # Fix RLS policy for areas table

  1. Security Changes
    - Drop the existing restrictive policy for areas table
    - Add new policies that allow anonymous and authenticated users to perform all operations
    - This matches the pattern used for the visits table which works correctly

  2. Changes Made
    - Remove "Temporary allow all areas access" policy that only works for authenticated users
    - Add separate policies for INSERT, SELECT, UPDATE, DELETE that work for both anon and authenticated roles
    - Ensure anonymous users can create, read, update, and delete areas just like visits
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Temporary allow all areas access" ON areas;

-- Create new policies that allow both anonymous and authenticated users
CREATE POLICY "Allow anonymous and authenticated users to read areas"
  ON areas
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anonymous and authenticated users to create areas"
  ON areas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to update areas"
  ON areas
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete areas"
  ON areas
  FOR DELETE
  TO anon, authenticated
  USING (true);