/*
  # Change assigned_to column from UUID to TEXT

  1. Changes
    - Alter `areas` table `assigned_to` column from UUID to TEXT
    - This allows storing team names like "Team A" instead of requiring UUIDs
    - Maintains existing data by converting any existing UUIDs to text format

  2. Security
    - No changes to RLS policies needed
    - Column type change only affects data storage format
*/

-- Change the assigned_to column from UUID to TEXT
ALTER TABLE areas ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;