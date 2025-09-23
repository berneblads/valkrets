/*
  # Add user tracking to areas table

  1. Changes
    - Add user_id column to areas table that references auth.users
    - Update RLS policies to support user-based access control
    - Add indexes for better performance

  2. Security
    - Users can see areas they created or are assigned to
    - Admins can see and manage all areas
    - Proper RLS policies for all CRUD operations
*/

-- Add user_id column to areas table (references auth.users)
ALTER TABLE areas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_areas_user_id ON areas(user_id);

-- Update RLS policy for executors to see their own areas and assigned areas
DROP POLICY IF EXISTS "Executors can read assigned areas" ON areas;

CREATE POLICY "Executors can read assigned areas" ON areas
  FOR SELECT
  TO authenticated
  USING (
    (assigned_to = auth.uid()) OR 
    (user_id = auth.uid()) OR 
    ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  );

-- Add policy for executors to create their own areas
CREATE POLICY "Executors can create own areas" ON areas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add policy for executors to update their own areas
CREATE POLICY "Executors can update own areas" ON areas
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK (user_id = auth.uid() OR (auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Add policy for executors to delete their own areas
CREATE POLICY "Executors can delete own areas" ON areas
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() ->> 'role'::text) = 'admin'::text);