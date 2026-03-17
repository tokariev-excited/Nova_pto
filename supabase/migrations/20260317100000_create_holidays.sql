-- ============================================================
-- Migration: Create holidays table
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. Create table
-- ==========================================================

CREATE TABLE IF NOT EXISTS holidays (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  date          date NOT NULL,
  is_custom     boolean NOT NULL DEFAULT false,
  country_code  text,
  year          integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ==========================================================
-- 2. Indexes
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_holidays_workspace
  ON holidays (workspace_id);

CREATE INDEX IF NOT EXISTS idx_holidays_workspace_date
  ON holidays (workspace_id, date);

-- ==========================================================
-- 3. updated_at trigger (reuse existing function)
-- ==========================================================

CREATE TRIGGER set_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 4. Enable RLS
-- ==========================================================

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 5. RLS policies (following time_off_categories pattern)
-- ==========================================================

CREATE POLICY holidays_select_workspace ON holidays
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY holidays_insert_admin ON holidays
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

CREATE POLICY holidays_update_admin ON holidays
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

CREATE POLICY holidays_delete_admin ON holidays
  FOR DELETE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

COMMIT;
