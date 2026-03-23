-- ============================================================
-- Migration: Validate employee status in create_time_off_record
-- Adds a guard so inactive/deleted employees cannot have
-- time-off records created for them, even via direct RPC call.
-- ============================================================

BEGIN;

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
  v_date_diff       integer;
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

  -- Calculate total days (fractional)
  v_date_diff     := (p_end_date - p_start_date);
  v_start_portion := CASE p_start_period WHEN 'morning' THEN 1.0 ELSE 0.5 END;
  v_end_portion   := CASE p_end_period   WHEN 'end_of_day' THEN 1.0 ELSE 0.5 END;
  v_total_days    := v_start_portion + (v_date_diff - 1) + v_end_portion;

  IF v_total_days <= 0 THEN
    RAISE EXCEPTION 'Invalid period combination: total days must be greater than zero';
  END IF;

  -- Look up employee (include status for validation below)
  SELECT id, first_name, last_name, email, avatar_url, status
  INTO v_employee
  FROM profiles
  WHERE id = p_employee_id AND workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found in this workspace';
  END IF;

  -- Guard: only active employees can have time-off records created
  IF v_employee.status <> 'active' THEN
    RAISE EXCEPTION 'Cannot create time-off for inactive or deleted employees';
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

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

COMMIT;
