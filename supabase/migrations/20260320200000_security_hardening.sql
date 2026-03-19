-- ============================================================
-- Migration: Security hardening
-- Fixes 9 RLS vulnerabilities found in audit:
--   CRITICAL: privilege escalation, workspace injection,
--             forged owner_id, cross-workspace RPC attacks
--   HIGH:     admin can move profiles, cross-workspace profile_id in requests
--   MEDIUM:   owner_id mutable, balances_select subquery inconsistency
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Helper: get_my_role()
-- Returns the calling user's current role (SECURITY DEFINER
-- bypasses RLS). Used in profiles_update_own WITH CHECK to
-- prevent users from promoting their own role.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 2. CRITICAL FIX: profiles_update_own
-- Previous policy: USING (id = auth.uid()) with no WITH CHECK.
-- Postgres re-uses USING as WITH CHECK when omitted, so
-- "id = auth.uid()" was the only constraint — any user could
-- run: UPDATE profiles SET role='admin' WHERE id=auth.uid()
-- Fix: WITH CHECK locks role and workspace_id to current values.
-- ============================================================

DROP POLICY IF EXISTS profiles_update_own ON profiles;

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND workspace_id = get_user_workspace_id()  -- cannot move to another workspace
    AND role = get_my_role()                    -- cannot self-promote
  );

-- ============================================================
-- 3. HIGH FIX: profiles_update_admin
-- Previous policy had no WITH CHECK, so an admin could update
-- workspace_id to move an employee to another workspace.
-- Fix: WITH CHECK ensures workspace_id stays in same workspace.
-- ============================================================

DROP POLICY IF EXISTS profiles_update_admin ON profiles;

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE
  USING (workspace_id = get_user_workspace_id() AND is_workspace_admin())
  WITH CHECK (
    workspace_id = get_user_workspace_id()  -- cannot move employees between workspaces
    AND is_workspace_admin()
  );

-- ============================================================
-- 4. CRITICAL FIX: profiles_insert_own
-- Previous policy: WITH CHECK (id = auth.uid()) — no
-- restriction on workspace_id or role. A user who knew another
-- workspace UUID could insert themselves into it as admin.
-- Fix: workspace_id must point to a workspace owned by the caller.
-- Founder flow still works: workspace is created first with
-- owner_id = auth.uid(), so this check passes.
-- Invited users: created by invite-employee Edge Function using
-- the admin/service-role client, bypassing RLS entirely.
-- ============================================================

DROP POLICY IF EXISTS profiles_insert_own ON profiles;

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = workspace_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. CRITICAL FIX: workspaces_insert_authenticated
-- Previous policy: WITH CHECK (auth.uid() IS NOT NULL) — a user
-- could set owner_id to any user's UUID.
-- Fix: owner_id must equal the authenticated caller's user ID.
-- ============================================================

DROP POLICY IF EXISTS workspaces_insert_authenticated ON workspaces;

CREATE POLICY workspaces_insert_authenticated ON workspaces
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_id = auth.uid()
  );

-- ============================================================
-- 6. CRITICAL FIX: approve_time_off_request RPC
-- Previous function only checked is_workspace_admin() (true for
-- any admin). An admin from workspace A could approve a request
-- from workspace B if they knew the request UUID.
-- Fix: workspace isolation check after loading the request row.
-- ============================================================

CREATE OR REPLACE FUNCTION approve_time_off_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request         record;
  v_total_days      double precision;
  v_start_portion   double precision;
  v_end_portion     double precision;
  v_balance         double precision;
  v_accrual_method  text;
BEGIN
  -- Auth guard
  IF NOT is_workspace_admin() THEN
    RAISE EXCEPTION 'Permission denied: only workspace admins can approve time-off requests';
  END IF;

  -- Load and lock the request
  SELECT * INTO v_request
  FROM time_off_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- SECURITY: verify request belongs to caller's workspace
  IF v_request.workspace_id <> get_user_workspace_id() THEN
    RAISE EXCEPTION 'Permission denied: request belongs to a different workspace';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Calculate portions
  v_start_portion := CASE v_request.start_period WHEN 'morning' THEN 1.0 ELSE 0.5 END;
  v_end_portion   := CASE v_request.end_period   WHEN 'end_of_day' THEN 1.0 ELSE 0.5 END;

  -- Business-day calculation: skip weekends and holidays
  SELECT COALESCE(SUM(
    CASE
      WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN 0
      WHEN d::date IN (SELECT date FROM holidays WHERE workspace_id = v_request.workspace_id) THEN 0
      WHEN d::date = v_request.start_date AND d::date = v_request.end_date THEN v_start_portion + v_end_portion - 1.0
      WHEN d::date = v_request.start_date THEN v_start_portion
      WHEN d::date = v_request.end_date THEN v_end_portion
      ELSE 1.0
    END
  ), 0) INTO v_total_days
  FROM generate_series(v_request.start_date::timestamp, v_request.end_date::timestamp, '1 day'::interval) AS d;

  -- Handle balance deduction if category exists
  IF v_request.category_id IS NOT NULL THEN
    SELECT accrual_method INTO v_accrual_method
    FROM time_off_categories
    WHERE id = v_request.category_id;

    IF v_accrual_method IS NOT NULL AND v_accrual_method <> 'unlimited' THEN
      SELECT remaining_days INTO v_balance
      FROM employee_balances
      WHERE employee_id = v_request.profile_id
        AND category_id = v_request.category_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'No balance allocated for this employee and category';
      END IF;

      IF v_balance < v_total_days THEN
        RAISE EXCEPTION 'Insufficient balance: % days available, % days requested', v_balance, v_total_days;
      END IF;

      UPDATE employee_balances
      SET remaining_days = remaining_days - v_total_days
      WHERE employee_id = v_request.profile_id
        AND category_id = v_request.category_id;
    END IF;
  END IF;

  -- Approve the request and store calculated total_days
  UPDATE time_off_requests
  SET status = 'approved',
      total_days = v_total_days
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'id', p_request_id,
    'total_days', v_total_days,
    'remaining_balance', CASE
      WHEN v_request.category_id IS NULL THEN NULL
      WHEN v_accrual_method = 'unlimited' THEN NULL
      ELSE v_balance - v_total_days
    END
  );
END;
$$;

-- ============================================================
-- 7. CRITICAL FIX: replace_imported_holidays RPC
-- Previous function only checked is_workspace_admin(). An admin
-- could wipe another workspace's holidays if they knew its UUID.
-- Fix: p_workspace_id must match caller's workspace.
-- ============================================================

CREATE OR REPLACE FUNCTION replace_imported_holidays(
  p_workspace_id uuid,
  p_holidays     jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auth guard: caller must be a workspace admin
  IF NOT is_workspace_admin() THEN
    RAISE EXCEPTION 'Permission denied: only workspace admins can import holidays';
  END IF;

  -- SECURITY: verify caller owns the target workspace
  IF p_workspace_id <> get_user_workspace_id() THEN
    RAISE EXCEPTION 'Permission denied: cannot manage holidays in another workspace';
  END IF;

  -- 1. Wipe every imported holiday for this workspace (preserve custom)
  DELETE FROM holidays
  WHERE workspace_id = p_workspace_id
    AND is_custom = false;

  -- 2. Insert the new set
  INSERT INTO holidays (workspace_id, name, date, is_custom, country_code, year)
  SELECT
    p_workspace_id,
    (h->>'name')::text,
    (h->>'date')::date,
    false,
    (h->>'country_code')::text,
    (h->>'year')::integer
  FROM jsonb_array_elements(p_holidays) AS h;
END;
$$;

-- ============================================================
-- 8. CRITICAL FIX: create_time_off_record RPC
-- No explicit workspace ownership check at entry. An admin could
-- pass a foreign workspace_id (if they knew employee/category UUIDs).
-- Fix: p_workspace_id must match caller's workspace upfront.
-- ============================================================

CREATE OR REPLACE FUNCTION create_time_off_record(
  p_workspace_id  uuid,
  p_employee_id   uuid,
  p_category_id   uuid,
  p_start_date    date,
  p_end_date      date,
  p_comment       text DEFAULT NULL,
  p_start_period  text DEFAULT 'morning',
  p_end_period    text DEFAULT 'end_of_day'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_days      double precision;
  v_start_portion   double precision;
  v_end_portion     double precision;
  v_balance         double precision;
  v_employee        record;
  v_category_name   text;
  v_accrual_method  text;
  v_request_type    text;
  v_request_id      uuid;
BEGIN
  -- Auth guard
  IF NOT is_workspace_admin() THEN
    RAISE EXCEPTION 'Permission denied: only workspace admins can create time-off records';
  END IF;

  -- SECURITY: verify caller owns the target workspace
  IF p_workspace_id <> get_user_workspace_id() THEN
    RAISE EXCEPTION 'Permission denied: cannot create records in another workspace';
  END IF;

  -- Validate dates
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;

  -- Validate periods
  IF p_start_period NOT IN ('morning', 'midday') THEN
    RAISE EXCEPTION 'Invalid start_period: must be morning or midday';
  END IF;
  IF p_end_period NOT IN ('midday', 'end_of_day') THEN
    RAISE EXCEPTION 'Invalid end_period: must be midday or end_of_day';
  END IF;

  -- Calculate portions
  v_start_portion := CASE p_start_period WHEN 'morning' THEN 1.0 ELSE 0.5 END;
  v_end_portion   := CASE p_end_period   WHEN 'end_of_day' THEN 1.0 ELSE 0.5 END;

  -- Business-day calculation: skip weekends and holidays
  SELECT COALESCE(SUM(
    CASE
      WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN 0
      WHEN d::date IN (SELECT date FROM holidays WHERE workspace_id = p_workspace_id) THEN 0
      WHEN d::date = p_start_date AND d::date = p_end_date THEN v_start_portion + v_end_portion - 1.0
      WHEN d::date = p_start_date THEN v_start_portion
      WHEN d::date = p_end_date THEN v_end_portion
      ELSE 1.0
    END
  ), 0) INTO v_total_days
  FROM generate_series(p_start_date::timestamp, p_end_date::timestamp, '1 day'::interval) AS d;

  IF v_total_days <= 0 THEN
    RAISE EXCEPTION 'Invalid period combination: total days must be greater than zero';
  END IF;

  -- Look up employee
  SELECT id, first_name, last_name, email, avatar_url
  INTO v_employee
  FROM profiles
  WHERE id = p_employee_id AND workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found in this workspace';
  END IF;

  -- Look up category
  SELECT name, accrual_method INTO v_category_name, v_accrual_method
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

  -- Check and deduct balance (skip for unlimited categories)
  IF v_accrual_method <> 'unlimited' THEN
    SELECT remaining_days INTO v_balance
    FROM employee_balances
    WHERE employee_id = p_employee_id AND category_id = p_category_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No balance allocated for this employee and category';
    END IF;

    IF v_balance < v_total_days THEN
      RAISE EXCEPTION 'Insufficient balance: % days available, % days requested', v_balance, v_total_days;
    END IF;

    -- Deduct from balance
    UPDATE employee_balances
    SET remaining_days = remaining_days - v_total_days
    WHERE employee_id = p_employee_id AND category_id = p_category_id;
  END IF;

  -- Insert the request
  INSERT INTO time_off_requests (
    profile_id, workspace_id, category_id,
    start_date, end_date, start_period, end_period, total_days,
    request_type, status, comment,
    employee_name, employee_email, employee_avatar_url
  ) VALUES (
    p_employee_id, p_workspace_id, p_category_id,
    p_start_date, p_end_date, p_start_period, p_end_period, v_total_days,
    v_request_type, 'approved', p_comment,
    coalesce(trim(concat(v_employee.first_name, ' ', v_employee.last_name)), ''),
    v_employee.email,
    v_employee.avatar_url
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'id', v_request_id,
    'total_days', v_total_days,
    'remaining_balance', CASE
      WHEN v_accrual_method = 'unlimited' THEN NULL
      ELSE v_balance - v_total_days
    END
  );
END;
$$;

-- ============================================================
-- 9. HIGH FIX: admin_insert on time_off_requests
-- Previous policy did not validate that profile_id belongs to
-- the same workspace, allowing an admin to link a request to an
-- employee from a different workspace.
-- ============================================================

DROP POLICY IF EXISTS admin_insert ON time_off_requests;

CREATE POLICY admin_insert ON time_off_requests
  FOR INSERT WITH CHECK (
    is_workspace_admin()
    AND workspace_id = get_user_workspace_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id AND workspace_id = get_user_workspace_id()
    )
  );

-- ============================================================
-- 10. HIGH FIX: requests_delete_own_pending
-- Missing workspace_id constraint (defense-in-depth).
-- ============================================================

DROP POLICY IF EXISTS requests_delete_own_pending ON time_off_requests;

CREATE POLICY requests_delete_own_pending ON time_off_requests
  FOR DELETE USING (
    profile_id = auth.uid()
    AND workspace_id = get_user_workspace_id()
    AND status = 'pending'
  );

-- ============================================================
-- 11. MEDIUM FIX: prevent workspace owner_id changes
-- workspaces_update_admin had no column-level protection, so an
-- admin could transfer ownership by changing owner_id.
-- Fix: trigger that raises an exception on owner_id changes.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_owner_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'workspace owner_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_workspace_owner ON workspaces;

CREATE TRIGGER lock_workspace_owner
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION prevent_owner_id_change();

-- ============================================================
-- 12. MEDIUM FIX: balances_select
-- Previous policy used a raw subquery (SELECT workspace_id FROM
-- profiles WHERE id = auth.uid()) running with the caller's RLS
-- context. Replaced with the SECURITY DEFINER helper for
-- consistency and correctness.
-- ============================================================

DROP POLICY IF EXISTS balances_select ON employee_balances;

CREATE POLICY balances_select ON employee_balances
  FOR SELECT USING (workspace_id = get_user_workspace_id());

-- ============================================================
-- Force PostgREST schema cache refresh
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
