-- Add missing columns needed by Settings page
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
