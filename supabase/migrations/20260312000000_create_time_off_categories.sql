-- ============================================================
-- Migration: Create time_off_categories table
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. Create table
-- ==========================================================

CREATE TABLE IF NOT EXISTS time_off_categories (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                     text NOT NULL,
  emoji                    text,
  colour                   text NOT NULL DEFAULT 'red' CHECK (colour IN ('red', 'orange', 'green', 'blue', 'gray')),
  is_active                boolean NOT NULL DEFAULT true,
  leave_type               text NOT NULL CHECK (leave_type IN ('paid', 'unpaid')),
  accrual_method           text NOT NULL CHECK (accrual_method IN ('fixed', 'periodic', 'anniversary', 'unlimited')),
  amount_value             double precision,
  granting_frequency       text CHECK (granting_frequency IN ('yearly', 'hire_anniversary', 'monthly')),
  accrual_day              text,
  anniversary_years        integer,
  waiting_period_value     integer,
  waiting_period_unit      text CHECK (waiting_period_unit IN ('month', 'year')),
  carryover_limit_enabled  boolean NOT NULL DEFAULT false,
  carryover_max_days       integer,
  carryover_expiration_value integer,
  carryover_expiration_unit text CHECK (carryover_expiration_unit IN ('month', 'year')),
  sort_order               integer NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ==========================================================
-- 2. Indexes
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_time_off_categories_workspace
  ON time_off_categories (workspace_id);

CREATE INDEX IF NOT EXISTS idx_time_off_categories_workspace_sort
  ON time_off_categories (workspace_id, sort_order);

-- ==========================================================
-- 3. updated_at trigger (reuse existing function)
-- ==========================================================

CREATE TRIGGER set_time_off_categories_updated_at
  BEFORE UPDATE ON time_off_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 4. Enable RLS
-- ==========================================================

ALTER TABLE time_off_categories ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 5. RLS policies (following departments pattern)
-- ==========================================================

CREATE POLICY time_off_categories_select_workspace ON time_off_categories
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY time_off_categories_insert_admin ON time_off_categories
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

CREATE POLICY time_off_categories_update_admin ON time_off_categories
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

CREATE POLICY time_off_categories_delete_admin ON time_off_categories
  FOR DELETE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

COMMIT;
