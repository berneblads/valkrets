/*
  # Fix area_id column to allow null values

  1. Changes
    - Make `area_id` column in `visits` table nullable
    - This allows house visits to be created without being tied to a specific area
    - Aligns with the application logic where house visits don't always need an area_id

  2. Background
    - The application creates house visits that don't belong to specific areas
    - The current NOT NULL constraint on area_id prevents these visits from being saved
    - Making this column nullable fixes the constraint violation error
*/

-- Make area_id column nullable in visits table
ALTER TABLE visits ALTER COLUMN area_id DROP NOT NULL;