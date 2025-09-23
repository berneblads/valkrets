/*
  # Add asset storage for logos and graphics

  1. New Tables
    - `assets` - Store uploaded logos, graphics and other files
    - Support for different asset types (logo, icon, graphic, document)
    - Metadata storage for file information

  2. Security
    - Enable RLS on assets table
    - Allow authenticated users to upload and manage assets
    - Public read access for logos and graphics

  3. Storage
    - Create storage bucket for assets
    - Set up policies for file access
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    asset_type text NOT NULL CHECK (asset_type IN ('logo', 'icon', 'graphic', 'document', 'image')),
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    mime_type text,
    uploaded_by uuid,
    is_public boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_public ON assets(is_public);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for assets
CREATE POLICY "Public assets are viewable by everyone"
    ON assets
    FOR SELECT
    USING (is_public = true);

CREATE POLICY "Authenticated users can view all assets"
    ON assets
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can upload assets"
    ON assets
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own assets"
    ON assets
    FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all assets"
    ON assets
    FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- Insert KD logo as default asset
INSERT INTO assets (
    name,
    description,
    asset_type,
    file_name,
    file_path,
    mime_type,
    is_public,
    metadata
) VALUES (
    'KD Logotyp',
    'Kristdemokraternas officiella logotyp',
    'logo',
    'KD-logo-blue.svg',
    'https://kristdemokraterna.se/images/18.72d9f8c817e8ce3de0254710/1643616846958/KD-logo-blue.svg',
    'image/svg+xml',
    true,
    '{"source": "official", "color": "blue", "usage": "primary_logo"}'
) ON CONFLICT DO NOTHING;