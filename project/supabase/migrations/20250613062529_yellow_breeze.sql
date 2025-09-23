/*
  # Create Teams Management System

  1. New Tables
    - `teams` - Team storage with metadata
    - `team_members` - Team membership management
    - `team_areas` - Areas assigned to teams

  2. Security
    - Enable RLS on all tables
    - Add policies for team management
    - Real-time subscriptions support

  3. Features
    - Dynamic team creation
    - Team membership management
    - Area assignment to teams
    - Audit trail for team changes
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#003366',
    leader_id uuid,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    metadata jsonb DEFAULT '{}',
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    version integer DEFAULT 1
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id uuid,
    role text DEFAULT 'member' CHECK (role IN ('leader', 'member', 'coordinator')),
    joined_at timestamptz DEFAULT now(),
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Create team_areas table for area assignments
CREATE TABLE IF NOT EXISTS team_areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    assigned_at timestamptz DEFAULT now(),
    assigned_by uuid,
    priority integer DEFAULT 1,
    status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(area_id) -- Each area can only be assigned to one team
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_areas ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_areas_team_id ON team_areas(team_id);
CREATE INDEX IF NOT EXISTS idx_team_areas_area_id ON team_areas(area_id);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create version increment trigger for teams
CREATE TRIGGER teams_version_trigger
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();

-- RLS Policies for teams
CREATE POLICY "Allow anonymous and authenticated users to read teams"
    ON teams
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous and authenticated users to create teams"
    ON teams
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to update teams"
    ON teams
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete teams"
    ON teams
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- RLS Policies for team_members
CREATE POLICY "Allow anonymous and authenticated users to read team_members"
    ON team_members
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous and authenticated users to manage team_members"
    ON team_members
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for team_areas
CREATE POLICY "Allow anonymous and authenticated users to read team_areas"
    ON team_areas
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous and authenticated users to manage team_areas"
    ON team_areas
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Create function to assign area to team
CREATE OR REPLACE FUNCTION assign_area_to_team(
    area_id_param uuid,
    team_id_param uuid,
    assigned_by_param uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    -- Remove existing assignment if any
    DELETE FROM team_areas WHERE area_id = area_id_param;
    
    -- Create new assignment
    INSERT INTO team_areas (team_id, area_id, assigned_by)
    VALUES (team_id_param, area_id_param, assigned_by_param);
    
    -- Update areas table assigned_to field
    UPDATE areas 
    SET assigned_to = (SELECT name FROM teams WHERE id = team_id_param)
    WHERE id = area_id_param;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove area from team
CREATE OR REPLACE FUNCTION remove_area_from_team(area_id_param uuid)
RETURNS boolean AS $$
BEGIN
    -- Remove assignment
    DELETE FROM team_areas WHERE area_id = area_id_param;
    
    -- Update areas table
    UPDATE areas 
    SET assigned_to = NULL
    WHERE id = area_id_param;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Insert default teams (these will be removed by the application)
INSERT INTO teams (name, description, color, status) VALUES
    ('Team A', 'Standard team A', '#003366', 'active'),
    ('Team B', 'Standard team B', '#FFD700', 'active'),
    ('Team C', 'Standard team C', '#4A90E2', 'active')
ON CONFLICT (name) DO NOTHING;