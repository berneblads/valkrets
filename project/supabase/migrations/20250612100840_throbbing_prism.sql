/*
  # Fix RLS policies for areas table

  1. Security Updates
    - Update RLS policies for `areas` table to properly allow anonymous access
    - Ensure anonymous users can read and create areas
    - Maintain existing authenticated user permissions

  2. Changes Made
    - Drop existing restrictive policies
    - Create new policies that allow anonymous access for SELECT and INSERT operations
    - Keep UPDATE and DELETE permissions for authenticated users only
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to read areas" ON public.areas;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to create areas" ON public.areas;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to update areas" ON public.areas;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to delete areas" ON public.areas;

-- Create new policies with proper anonymous access
CREATE POLICY "Allow anonymous read access to areas"
  ON public.areas
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anonymous insert access to areas"
  ON public.areas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to areas"
  ON public.areas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access to areas"
  ON public.areas
  FOR DELETE
  TO authenticated
  USING (true);