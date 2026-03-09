-- Add owner_id to workspaces to protect the founding user
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Backfill: set owner_id to the earliest admin profile in each workspace
UPDATE workspaces w SET owner_id = (
  SELECT p.id FROM profiles p
  WHERE p.workspace_id = w.id AND p.role = 'admin'
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE w.owner_id IS NULL;

-- Remove orphaned workspaces that have no admin profile
DELETE FROM workspaces WHERE owner_id IS NULL;

ALTER TABLE workspaces ALTER COLUMN owner_id SET NOT NULL;
