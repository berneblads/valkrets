/*
  # Add house visit details columns

  1. New Columns
    - `door_knock_result` (text, nullable) - Stores the result of door knocking (positiv, negativ, ville_inte_prata, boende_öppnade_inte)
    - `address` (text, nullable) - Stores the resolved address string
    - `full_address` (jsonb, nullable) - Stores detailed address components (street, house_number, city, postal_code, county)

  2. Constraints
    - Add check constraint for valid door_knock_result values

  3. Indexes
    - Add index on door_knock_result for efficient filtering
    - Add index on address for search functionality
*/

-- Add new columns to visits table
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS door_knock_result TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS full_address JSONB;

-- Add check constraint for door_knock_result
ALTER TABLE visits 
ADD CONSTRAINT visits_door_knock_result_check 
CHECK (door_knock_result IS NULL OR door_knock_result = ANY (ARRAY['positiv'::text, 'negativ'::text, 'ville_inte_prata'::text, 'boende_öppnade_inte'::text]));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_door_knock_result ON visits (door_knock_result);
CREATE INDEX IF NOT EXISTS idx_visits_address ON visits USING gin (to_tsvector('swedish', address));