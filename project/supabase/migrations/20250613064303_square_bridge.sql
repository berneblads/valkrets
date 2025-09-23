/*
  # Campaign Activities and Types Schema

  1. New Tables
    - `campaign_types` - Stores configurable campaign types
    - `campaign_activities` - Stores activities that can be performed in campaign areas
    - `area_activities` - Tracks activities performed in specific areas

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Allow anonymous and authenticated users to read/write

  3. Features
    - Admin-configurable campaign types
    - Customizable campaign activities
    - Area-activity relationship tracking
    - Real-time synchronization support
*/

-- Create campaign_types table
CREATE TABLE IF NOT EXISTS campaign_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    color text DEFAULT '#003366',
    icon text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create campaign_activities table
CREATE TABLE IF NOT EXISTS campaign_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create area_activities junction table
CREATE TABLE IF NOT EXISTS area_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    activity_id uuid NOT NULL REFERENCES campaign_activities(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
    status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    scheduled_date date,
    completed_date date,
    notes text,
    metadata jsonb DEFAULT '{}',
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaign_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_activities ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_types_active ON campaign_types(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_types_sort ON campaign_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_active ON campaign_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_sort ON campaign_activities(sort_order);
CREATE INDEX IF NOT EXISTS idx_area_activities_area ON area_activities(area_id);
CREATE INDEX IF NOT EXISTS idx_area_activities_activity ON area_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_area_activities_team ON area_activities(team_id);
CREATE INDEX IF NOT EXISTS idx_area_activities_status ON area_activities(status);
CREATE INDEX IF NOT EXISTS idx_area_activities_scheduled ON area_activities(scheduled_date);

-- Create triggers for updated_at
CREATE TRIGGER update_campaign_types_updated_at
    BEFORE UPDATE ON campaign_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_activities_updated_at
    BEFORE UPDATE ON campaign_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_area_activities_updated_at
    BEFORE UPDATE ON area_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for campaign_types
CREATE POLICY "Allow anonymous and authenticated users to read campaign_types"
    ON campaign_types
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous and authenticated users to create campaign_types"
    ON campaign_types
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to update campaign_types"
    ON campaign_types
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete campaign_types"
    ON campaign_types
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- RLS Policies for campaign_activities
CREATE POLICY "Allow anonymous and authenticated users to read campaign_activities"
    ON campaign_activities
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous and authenticated users to create campaign_activities"
    ON campaign_activities
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to update campaign_activities"
    ON campaign_activities
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete campaign_activities"
    ON campaign_activities
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- RLS Policies for area_activities
CREATE POLICY "Allow anonymous and authenticated users to read area_activities"
    ON area_activities
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous and authenticated users to create area_activities"
    ON area_activities
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to update area_activities"
    ON area_activities
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated users to delete area_activities"
    ON area_activities
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- Insert default campaign activities
INSERT INTO campaign_activities (name, description, icon, sort_order) VALUES
    ('Mailbox flyers', 'Distribute flyers in mailboxes', 'mail', 1),
    ('Door knocking', 'Knock on doors and talk to residents', 'home', 2),
    ('Coffee distribution', 'Hand out coffee to people', 'coffee', 3),
    ('Information booth', 'Set up an information booth', 'info', 4),
    ('Poster hanging', 'Hang campaign posters', 'image', 5),
    ('Leaflet distribution', 'Hand out leaflets to people', 'file-text', 6)
ON CONFLICT DO NOTHING;

-- Insert default campaign types
INSERT INTO campaign_types (name, description, color, icon, sort_order) VALUES
    ('Standard', 'Standard campaign with door knocking and flyers', '#003366', 'home', 1),
    ('High priority', 'Focus areas with intensive campaigning', '#FFD700', 'star', 2),
    ('Event-based', 'Areas for campaign events and gatherings', '#4A90E2', 'calendar', 3),
    ('Digital', 'Digital campaign focus areas', '#50C878', 'wifi', 4)
ON CONFLICT DO NOTHING;