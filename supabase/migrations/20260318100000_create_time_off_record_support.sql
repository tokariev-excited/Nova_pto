-- ============================================================
-- Migration: Create time-off record support
-- Adds category_id to requests, employee_balances table,
-- admin insert policy, and atomic RPC function.
-- ============================================================

BEGIN;

-- ==========================================================
-- 1a. Add category_id to time_off_requests
-- ==========================================================

ALTER TABLE time_off_requests
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES time_off_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_requests_category ON time_off_requests(category_id);

-- ==========================================================
-- 1b. Create employee_balances table
-- ==========================================================

CREATE TABLE IF NOT EXISTS employee_balances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES time_off_categories(id) ON DELETE CASCADE,
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  remaining_days  double precision NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_balances_employee ON employee_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_balances_workspace ON employee_balances(workspace_id);

-- Reuse the existing updated_at trigger function
CREATE TRIGGER set_updated_at_balances
  BEFORE UPDATE ON employee_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE employee_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY balances_select ON employee_balances
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY balances_insert_admin ON employee_balances
  FOR INSERT WITH CHECK (
    is_workspace_admin()
    AND workspace_id = get_user_workspace_id()
  );

CREATE POLICY balances_update_admin ON employee_balances
  FOR UPDATE USING (
    is_workspace_admin()
    AND workspace_id = get_user_workspace_id()
  );

CREATE POLICY balances_delete_admin ON employee_balances
  FOR DELETE USING (
    is_workspace_admin()
    AND workspace_id = get_user_workspace_id()
  );

-- ==========================================================
-- 1c. Admin insert policy for time_off_requests
-- ==========================================================

CREATE POLICY admin_insert ON time_off_requests
  FOR INSERT WITH CHECK (
    is_workspace_admin()
    AND workspace_id = get_user_workspace_id()
  );

-- ==========================================================
-- 1d. RPC function: create_time_off_record
-- ==========================================================

CREATE OR REPLACE FUNCTION create_time_off_record(
  p_workspace_id  uuid,
  p_employee_id   uuid,
  p_category_id   uuid,
  p_start_date    date,
  p_end_date      date,
  p_comment       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_days    integer;
  v_balance       double precision;
  v_employee      record;
  v_category_name text;
  v_request_type  text;
  v_request_id    uuid;
BEGIN
  -- Auth guard
  IF NOT is_workspace_admin() THEN
    RAISE EXCEPTION 'Permission denied: only workspace admins can create time-off records';
  END IF;

  -- Validate dates
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;

  -- Calculate total days (inclusive)
  v_total_days := (p_end_date - p_start_date) + 1;

  -- Look up employee
  SELECT id, first_name, last_name, email, avatar_url
  INTO v_employee
  FROM profiles
  WHERE id = p_employee_id AND workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found in this workspace';
  END IF;

  -- Look up category name for request_type mapping
  SELECT name INTO v_category_name
  FROM time_off_categories
  WHERE id = p_category_id AND workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found in this workspace';
  END IF;

  -- Map category name to request_type
  v_request_type := CASE lower(v_category_name)
    WHEN 'vacation' THEN 'vacation'
    WHEN 'sick leave' THEN 'sick_leave'
    WHEN 'personal' THEN 'personal'
    WHEN 'bereavement' THEN 'bereavement'
    ELSE 'other'
  END;

  -- Check balance
  SELECT remaining_days INTO v_balance
  FROM employee_balances
  WHERE employee_id = p_employee_id AND category_id = p_category_id
  FOR UPDATE; -- lock the row for the transaction

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No balance allocated for this employee and category';
  END IF;

  IF v_balance < v_total_days THEN
    RAISE EXCEPTION 'Insufficient balance: % days available, % days requested', v_balance, v_total_days;
  END IF;

  -- Insert the request
  INSERT INTO time_off_requests (
    profile_id, workspace_id, category_id,
    start_date, end_date, request_type, status, comment,
    employee_name, employee_email, employee_avatar_url
  ) VALUES (
    p_employee_id, p_workspace_id, p_category_id,
    p_start_date, p_end_date, v_request_type, 'approved', p_comment,
    coalesce(trim(concat(v_employee.first_name, ' ', v_employee.last_name)), ''),
    v_employee.email,
    v_employee.avatar_url
  )
  RETURNING id INTO v_request_id;

  -- Deduct from balance
  UPDATE employee_balances
  SET remaining_days = remaining_days - v_total_days
  WHERE employee_id = p_employee_id AND category_id = p_category_id;

  -- Return the created request
  RETURN jsonb_build_object(
    'id', v_request_id,
    'total_days', v_total_days,
    'remaining_balance', v_balance - v_total_days
  );
END;
$$;

-- ==========================================================
-- Force PostgREST schema cache refresh
-- ==========================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
