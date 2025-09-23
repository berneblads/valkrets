/*
  # Complete database schema setup

  1. New Tables
    - `areas` - Campaign areas with geographic data
    - `visits` - Visit tracking for areas
    - `election_data` - Election results data
    - `profiles` - User profiles with roles
    - `map_files` - File upload tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Admin and executor role separation

  3. Features
    - Automatic profile creation on user signup
    - Updated timestamp triggers
    - Comprehensive indexing for performance
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Areas table
CREATE TABLE IF NOT EXISTS areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    municipality text NOT NULL,
    electoral_district text NOT NULL,
    geojson jsonb NOT NULL,
    assigned_to uuid,
    status text DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'assigned', 'in_progress', 'completed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id uuid NOT NULL,
    user_id uuid NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    visit_type text NOT NULL CHECK (visit_type IN ('area_visit', 'household_contact')),
    notes text,
    campaign_materials jsonb,
    created_at timestamptz DEFAULT now()
);

-- Election data table
CREATE TABLE IF NOT EXISTS election_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    electoral_district_code text NOT NULL,
    municipality text NOT NULL,
    total_voters integer DEFAULT 0,
    turnout_percentage numeric(5,2) DEFAULT 0,
    party_results jsonb DEFAULT '{}',
    year integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(electoral_district_code, year)
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY,
    name text,
    email text UNIQUE,
    role text DEFAULT 'executor' CHECK (role IN ('admin', 'executor')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Map files table
CREATE TABLE IF NOT EXISTS map_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name text NOT NULL,
    file_type text NOT NULL CHECK (file_type IN ('municipalities', 'districts', 'election_data')),
    storage_path text NOT NULL,
    file_size bigint,
    mime_type text,
    uploaded_by uuid,
    upload_status text DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'processing', 'processed', 'error')),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints after table creation
DO $$
BEGIN
    -- Add foreign key for areas.assigned_to if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'areas_assigned_to_fkey'
    ) THEN
        ALTER TABLE areas ADD CONSTRAINT areas_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
    END IF;

    -- Add foreign key for visits.area_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'visits_area_id_fkey'
    ) THEN
        ALTER TABLE visits ADD CONSTRAINT visits_area_id_fkey 
        FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for visits.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'visits_user_id_fkey'
    ) THEN
        ALTER TABLE visits ADD CONSTRAINT visits_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for profiles.id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for map_files.uploaded_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'map_files_uploaded_by_fkey'
    ) THEN
        ALTER TABLE map_files ADD CONSTRAINT map_files_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_files ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_areas_assigned_to ON areas(assigned_to);
CREATE INDEX IF NOT EXISTS idx_areas_municipality ON areas(municipality);
CREATE INDEX IF NOT EXISTS idx_areas_status ON areas(status);
CREATE INDEX IF NOT EXISTS idx_visits_area_id ON visits(area_id);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_election_data_district_code ON election_data(electoral_district_code);
CREATE INDEX IF NOT EXISTS idx_election_data_municipality ON election_data(municipality);
CREATE INDEX IF NOT EXISTS idx_election_data_year ON election_data(year);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_map_files_type ON map_files(file_type);
CREATE INDEX IF NOT EXISTS idx_map_files_status ON map_files(upload_status);
CREATE INDEX IF NOT EXISTS idx_map_files_uploaded_by ON map_files(uploaded_by);

-- Create triggers (drop first if they exist)
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS update_map_files_updated_at ON map_files;
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
END $$;

-- Create new triggers
CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_files_updated_at
    BEFORE UPDATE ON map_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Areas policies
    DROP POLICY IF EXISTS "Admins can manage all areas" ON areas;
    DROP POLICY IF EXISTS "Executors can read assigned areas" ON areas;
    
    -- Visits policies
    DROP POLICY IF EXISTS "Users can manage own visits" ON visits;
    DROP POLICY IF EXISTS "Admins can read all visits" ON visits;
    
    -- Election data policies
    DROP POLICY IF EXISTS "Authenticated users can read election data" ON election_data;
    DROP POLICY IF EXISTS "Admins can manage election data" ON election_data;
    
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    
    -- Map files policies
    DROP POLICY IF EXISTS "Users can view map files" ON map_files;
    DROP POLICY IF EXISTS "Admins can manage all map files" ON map_files;
END $$;

-- RLS Policies for areas
CREATE POLICY "Admins can manage all areas" ON areas
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Executors can read assigned areas" ON areas
    FOR SELECT TO authenticated
    USING (assigned_to = auth.uid() OR (auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for visits
CREATE POLICY "Users can manage own visits" ON visits
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all visits" ON visits
    FOR SELECT TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for election_data
CREATE POLICY "Authenticated users can read election data" ON election_data
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage election data" ON election_data
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.role = 'admin'
    ));

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.role = 'admin'
    ));

-- RLS Policies for map_files
CREATE POLICY "Users can view map files" ON map_files
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage all map files" ON map_files
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'executor'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();