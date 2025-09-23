-- Create sync infrastructure for real-time updates and conflict resolution

-- Add version control and sync metadata to areas table
ALTER TABLE areas ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'));

-- Add version control and sync metadata to visits table  
ALTER TABLE visits ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'));

-- Create sync_events table for tracking changes
CREATE TABLE IF NOT EXISTS sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('visit', 'area')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('create', 'update', 'delete')),
  data jsonb,
  user_id uuid,
  timestamp timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);

-- Create indexes for sync_events
CREATE INDEX IF NOT EXISTS idx_sync_events_entity ON sync_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_timestamp ON sync_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sync_events_processed ON sync_events(processed);

-- Enable RLS on sync_events
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;

-- Create policy for sync_events
CREATE POLICY "Allow authenticated users to manage sync events" ON sync_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to increment version on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for version control
DROP TRIGGER IF EXISTS areas_version_trigger ON areas;
CREATE TRIGGER areas_version_trigger
  BEFORE UPDATE ON areas
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS visits_version_trigger ON visits;
CREATE TRIGGER visits_version_trigger
  BEFORE UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Create function to log sync events
CREATE OR REPLACE FUNCTION log_sync_event()
RETURNS TRIGGER AS $$
DECLARE
  event_type_val text;
  entity_type_val text;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type_val = 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    event_type_val = 'update';
  ELSIF TG_OP = 'DELETE' THEN
    event_type_val = 'delete';
  END IF;

  -- Determine entity type from table name
  IF TG_TABLE_NAME = 'areas' THEN
    entity_type_val = 'area';
  ELSIF TG_TABLE_NAME = 'visits' THEN
    entity_type_val = 'visit';
  END IF;

  -- Insert sync event
  INSERT INTO sync_events (entity_type, entity_id, event_type, data, user_id)
  VALUES (
    entity_type_val,
    COALESCE(NEW.id, OLD.id),
    event_type_val,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for sync event logging
DROP TRIGGER IF EXISTS areas_sync_trigger ON areas;
CREATE TRIGGER areas_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON areas
  FOR EACH ROW
  EXECUTE FUNCTION log_sync_event();

DROP TRIGGER IF EXISTS visits_sync_trigger ON visits;
CREATE TRIGGER visits_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION log_sync_event();

-- Create function for conflict resolution
CREATE OR REPLACE FUNCTION resolve_conflict(
  entity_type_param text,
  entity_id_param uuid,
  resolution_data jsonb
)
RETURNS boolean AS $$
BEGIN
  -- Update the entity with resolved data
  IF entity_type_param = 'area' THEN
    UPDATE areas 
    SET 
      name = resolution_data->>'name',
      geojson = resolution_data->'geojson',
      sync_status = 'synced',
      version = (resolution_data->>'version')::integer,
      updated_at = now()
    WHERE id = entity_id_param;
  ELSIF entity_type_param = 'visit' THEN
    UPDATE visits
    SET
      notes = resolution_data->>'notes',
      sync_status = 'synced', 
      version = (resolution_data->>'version')::integer,
      updated_at = now()
    WHERE id = entity_id_param;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for version control
CREATE INDEX IF NOT EXISTS idx_areas_version ON areas(version);
CREATE INDEX IF NOT EXISTS idx_visits_version ON visits(version);
CREATE INDEX IF NOT EXISTS idx_areas_sync_status ON areas(sync_status);
CREATE INDEX IF NOT EXISTS idx_visits_sync_status ON visits(sync_status);