BEGIN;

-- 1. Add denormalized display fields to time_off_requests
ALTER TABLE time_off_requests ADD COLUMN IF NOT EXISTS employee_name text NOT NULL DEFAULT '';
ALTER TABLE time_off_requests ADD COLUMN IF NOT EXISTS employee_email text NOT NULL DEFAULT '';
ALTER TABLE time_off_requests ADD COLUMN IF NOT EXISTS employee_avatar_url text;

-- 2. Add indexes on FK columns (not auto-created by Postgres)
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_workspace ON departments(workspace_id);

-- 3. Unique constraint: one profile per email per workspace
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_workspace_email_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_workspace_email_unique
      UNIQUE (workspace_id, email);
  END IF;
END $$;

COMMIT;
