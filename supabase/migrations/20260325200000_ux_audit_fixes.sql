-- ============================================================
-- Migration: UX Audit Fixes
-- P0: Web-facing rejection RPC with row locking
-- P0: Employee-status guard on approval RPCs
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. reject_time_off_request — Web-facing rejection RPC
--    Uses auth.uid() for caller verification (same pattern as
--    approve_time_off_request). Row-locked to prevent races.
-- ==========================================================

CREATE OR REPLACE FUNCTION reject_time_off_request(
  p_request_id       uuid,
  p_rejection_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  -- Auth guard
  IF NOT is_workspace_admin() THEN
    RAISE EXCEPTION 'Permission denied: only workspace admins can reject time-off requests';
  END IF;

  -- Load and lock the request
  SELECT * INTO v_request
  FROM time_off_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Reject the request
  UPDATE time_off_requests
  SET status = 'rejected',
      rejection_reason = p_rejection_reason
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'id', p_request_id,
    'status', 'rejected'
  );
END;
$$;

-- ==========================================================
-- 2. approve_time_off_request — Add employee-status guard
--    Re-create with employee active check before approval.
-- ==========================================================

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
  v_employee_status text;
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

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Check employee is still active
  SELECT status INTO v_employee_status
  FROM profiles
  WHERE id = v_request.profile_id;

  IF v_employee_status IS NULL OR v_employee_status <> 'active' THEN
    RAISE EXCEPTION 'Cannot approve: employee is no longer active';
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

-- ==========================================================
-- 3. approve_time_off_request_bot — Add employee-status guard
--    Re-create with employee active check before approval.
-- ==========================================================

CREATE OR REPLACE FUNCTION approve_time_off_request_bot(
  p_request_id       uuid,
  p_admin_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role      text;
  v_admin_workspace uuid;
  v_request         record;
  v_total_days      double precision;
  v_start_portion   double precision;
  v_end_portion     double precision;
  v_balance         double precision;
  v_accrual_method  text;
  v_employee_status text;
BEGIN
  -- Verify the admin profile exists and is actually an admin
  SELECT role, workspace_id INTO v_admin_role, v_admin_workspace
  FROM profiles
  WHERE id = p_admin_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin profile not found';
  END IF;

  IF v_admin_role <> 'admin' THEN
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

  -- Verify the request belongs to the admin's workspace
  IF v_request.workspace_id <> v_admin_workspace THEN
    RAISE EXCEPTION 'Request does not belong to your workspace';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Check employee is still active
  SELECT status INTO v_employee_status
  FROM profiles
  WHERE id = v_request.profile_id;

  IF v_employee_status IS NULL OR v_employee_status <> 'active' THEN
    RAISE EXCEPTION 'Cannot approve: employee is no longer active';
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

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

COMMIT;
