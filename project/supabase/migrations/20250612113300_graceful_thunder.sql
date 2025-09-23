/*
  # Fix RLS policies for areas table

  1. Security Changes
    - Update RLS policies for areas table to allow anonymous users to UPDATE and DELETE
    - This matches the permissions structure of the visits table
    - Ensures drawn objects can be properly updated and deleted without authentication

  2. Changes Made
    - Drop existing restrictive UPDATE and DELETE policies
    - Create new policies allowing both anonymous and authenticated users
    - Maintain existing SELECT and INSERT policies that already work correctly
*/

-- Drop the existing restrictive policies for UPDATE and DELETE
DROP POLICY IF EXISTS "Allow authenticated update access to areas" ON public.areas;
DROP POLICY IF EXISTS "Allow authenticated delete access to areas" ON public.areas;

-- Create new policies that allow both anonymous and authenticated users to UPDATE and DELETE
CREATE POLICY "Allow anonymous and authenticated users to update areas"
  ON public.areas
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete areas"
  ON public.areas
  FOR DELETE
  TO anon, authenticated
  USING (true);