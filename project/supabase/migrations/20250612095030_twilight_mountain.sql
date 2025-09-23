/*
  # Fix sync_events RLS policy for anonymous users

  1. Security Changes
    - Update the INSERT policy on `sync_events` table to allow anonymous users
    - This is needed because the `log_sync_event()` trigger function creates sync_events 
      records when visits or areas are modified, and the app currently uses anonymous access
    
  2. Changes Made
    - Drop the existing restrictive INSERT policy
    - Create a new INSERT policy that allows both anonymous and authenticated users
    - Keep the existing SELECT, UPDATE, and DELETE policies for authenticated users only
*/

-- Drop the existing INSERT policy that only allows authenticated users
DROP POLICY IF EXISTS "Allow insert for sync events" ON sync_events;

-- Create a new INSERT policy that allows both anonymous and authenticated users
-- This is necessary because the sync_events table is populated by database triggers
-- when visits or areas are created/updated/deleted, and the app uses anonymous access
CREATE POLICY "Allow anonymous and authenticated users to insert sync events"
  ON sync_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);