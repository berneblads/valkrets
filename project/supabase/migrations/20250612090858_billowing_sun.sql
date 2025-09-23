/*
  # Gör user_id nullable och slappna av RLS-policyer för utveckling

  1. Ändringar
    - Ta bort foreign key constraints som refererar till icke-existerande users-tabell
    - Gör user_id och assigned_to kolumner nullable
    - Slappna av RLS-policyer för utveckling (TILLFÄLLIGT)

  2. Säkerhet
    - VARNING: Dessa ändringar är endast för utveckling
    - RLS-policyer tillåter alla autentiserade användare att läsa/skriva data
    - Måste återställas innan produktion

  3. Tabeller som påverkas
    - visits: user_id blir nullable
    - areas: user_id och assigned_to blir nullable
    - map_files: uploaded_by blir nullable
    - profiles: foreign key till users tas bort
*/

-- Ta bort foreign key constraints som refererar till users-tabellen
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_user_id_fkey;
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_user_id_fkey;
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_assigned_to_fkey;
ALTER TABLE map_files DROP CONSTRAINT IF EXISTS map_files_uploaded_by_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Gör user_id kolumner nullable
ALTER TABLE visits ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE areas ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE areas ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE map_files ALTER COLUMN uploaded_by DROP NOT NULL;

-- Slappna av RLS-policyer för visits-tabellen (TILLFÄLLIGT)
DROP POLICY IF EXISTS "Users can manage own visits" ON visits;
DROP POLICY IF EXISTS "Admins can read all visits" ON visits;

CREATE POLICY "Temporary allow all visits access" ON visits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Slappna av RLS-policyer för areas-tabellen (TILLFÄLLIGT)
DROP POLICY IF EXISTS "Admins can manage all areas" ON areas;
DROP POLICY IF EXISTS "Executors can create own areas" ON areas;
DROP POLICY IF EXISTS "Executors can delete own areas" ON areas;
DROP POLICY IF EXISTS "Executors can read assigned areas" ON areas;
DROP POLICY IF EXISTS "Executors can update own areas" ON areas;

CREATE POLICY "Temporary allow all areas access" ON areas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Slappna av RLS-policyer för map_files-tabellen (TILLFÄLLIGT)
DROP POLICY IF EXISTS "Admins can manage all map files" ON map_files;
DROP POLICY IF EXISTS "Users can view map files" ON map_files;

CREATE POLICY "Temporary allow all map_files access" ON map_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Slappna av RLS-policyer för profiles-tabellen (TILLFÄLLIGT)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Temporary allow all profiles access" ON profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);