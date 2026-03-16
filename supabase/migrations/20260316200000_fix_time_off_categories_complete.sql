-- ============================================================
-- Migration: Fix time_off_categories table — bring to correct state
-- Idempotent: safe to run regardless of current table shape
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. Ensure ALL columns exist
-- ==========================================================

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS emoji text;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS colour text NOT NULL DEFAULT 'red';

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS leave_type text NOT NULL DEFAULT 'paid';

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS accrual_method text NOT NULL DEFAULT 'fixed';

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS amount_value double precision;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS granting_frequency text;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS accrual_day text;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS anniversary_years integer;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS waiting_period_value integer;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS waiting_period_unit text;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS carryover_limit_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS carryover_max_days integer;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS carryover_expiration_value integer;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS carryover_expiration_unit text;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ==========================================================
-- 2. Ensure CHECK constraints are correct
--    DROP first (idempotent), then ADD
-- ==========================================================

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_colour_check;
ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_colour_check
  CHECK (colour IN ('red', 'orange', 'green', 'blue', 'gray'));

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_leave_type_check;
ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_leave_type_check
  CHECK (leave_type IN ('paid', 'unpaid'));

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_accrual_method_check;
ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_accrual_method_check
  CHECK (accrual_method IN ('fixed', 'periodic', 'anniversary', 'unlimited'));

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_granting_frequency_check;
ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_granting_frequency_check
  CHECK (granting_frequency IN ('yearly', 'hire_anniversary', 'monthly', 'weekly', 'bi_weekly', 'quarterly'));

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_waiting_period_unit_check;
ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_waiting_period_unit_check
  CHECK (waiting_period_unit IN ('month', 'year'));

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_carryover_expiration_unit_check;
ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_carryover_expiration_unit_check
  CHECK (carryover_expiration_unit IN ('month', 'year'));

-- ==========================================================
-- 3. Ensure indexes exist
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_time_off_categories_workspace
  ON time_off_categories (workspace_id);

CREATE INDEX IF NOT EXISTS idx_time_off_categories_workspace_sort
  ON time_off_categories (workspace_id, sort_order);

-- ==========================================================
-- 4. Ensure updated_at trigger exists
-- ==========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_time_off_categories_updated_at'
      AND tgrelid = 'time_off_categories'::regclass
  ) THEN
    CREATE TRIGGER set_time_off_categories_updated_at
      BEFORE UPDATE ON time_off_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- ==========================================================
-- 5. Ensure RLS enabled + policies exist
-- ==========================================================

ALTER TABLE time_off_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'time_off_categories'
      AND policyname = 'time_off_categories_select_workspace'
  ) THEN
    CREATE POLICY time_off_categories_select_workspace ON time_off_categories
      FOR SELECT USING (workspace_id = get_user_workspace_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'time_off_categories'
      AND policyname = 'time_off_categories_insert_admin'
  ) THEN
    CREATE POLICY time_off_categories_insert_admin ON time_off_categories
      FOR INSERT WITH CHECK (
        workspace_id = get_user_workspace_id() AND is_workspace_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'time_off_categories'
      AND policyname = 'time_off_categories_update_admin'
  ) THEN
    CREATE POLICY time_off_categories_update_admin ON time_off_categories
      FOR UPDATE USING (
        workspace_id = get_user_workspace_id() AND is_workspace_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'time_off_categories'
      AND policyname = 'time_off_categories_delete_admin'
  ) THEN
    CREATE POLICY time_off_categories_delete_admin ON time_off_categories
      FOR DELETE USING (
        workspace_id = get_user_workspace_id() AND is_workspace_admin()
      );
  END IF;
END
$$;

-- ==========================================================
-- 6. Force PostgREST schema cache refresh
-- ==========================================================

NOTIFY pgrst, 'reload schema';

COMMIT;
