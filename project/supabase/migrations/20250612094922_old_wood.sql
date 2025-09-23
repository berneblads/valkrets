/*
  # Fix sync_events RLS policy for database triggers

  1. Security Changes
    - Update sync_events RLS policy to allow anonymous users to insert records
    - This is needed because the visits table triggers need to log sync events
    - The visits table allows anonymous access, so sync_events must also allow it for triggers to work

  2. Policy Updates
    - Allow both anonymous and authenticated users to insert sync events
    - Keep read/update/delete restricted to authenticated users only
    - This ensures triggers can log events regardless of user authentication status
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage sync events" ON sync_events;

-- Create separate policies for different operations
-- Allow both anon and authenticated users to insert (needed for triggers)
CREATE POLICY "Allow insert for sync events"
  ON sync_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow only authenticated users to read sync events
CREATE POLICY "Allow authenticated users to read sync events"
  ON sync_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow only authenticated users to update sync events
CREATE POLICY "Allow authenticated users to update sync events"
  ON sync_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow only authenticated users to delete sync events
CREATE POLICY "Allow authenticated users to delete sync events"
  ON sync_events
  FOR DELETE
  TO authenticated
  USING (true);