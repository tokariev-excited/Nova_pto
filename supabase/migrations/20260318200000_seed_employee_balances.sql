-- ============================================================
-- Migration: Seed employee_balances automatically
-- Adds triggers to create balance rows when employees or
-- categories are created, patches the RPC for unlimited
-- categories, and backfills existing data.
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. Helper: seed balances for a single employee
-- ==========================================================

CREATE OR REPLACE FUNCTION seed_balances_for_employee(
  p_employee_id  uuid,
  p_workspace_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO employee_balances (employee_id, category_id, workspace_id, remaining_days)
  SELECT
    p_employee_id,
    c.id,
    p_workspace_id,
    CASE
      WHEN c.accrual_method = 'unlimited' THEN 0
      ELSE COALESCE(c.amount_value, 0)
    END
  FROM time_off_categories c
  WHERE c.workspace_id = p_workspace_id
    AND c.is_active = true
  ON CONFLICT (employee_id, category_id) DO NOTHING;
END;
$$;

-- ==========================================================
-- 2. Helper: seed balances for a single category
-- ==========================================================

CREATE OR REPLACE FUNCTION seed_balances_for_category(
  p_category_id    uuid,
  p_workspace_id   uuid,
  p_accrual_method text,
  p_amount_value   double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO employee_balances (employee_id, category_id, workspace_id, remaining_days)
  SELECT
    p.id,
    p_category_id,
    p_workspace_id,
    CASE
      WHEN p_accrual_method = 'unlimited' THEN 0
      ELSE COALESCE(p_amount_value, 0)
    END
  FROM profiles p
  WHERE p.workspace_id = p_workspace_id
    AND p.status = 'active'
  ON CONFLICT (employee_id, category_id) DO NOTHING;
END;
$$;

-- ==========================================================
-- 3. Trigger: new employee → seed balances for all categories
-- ==========================================================

CREATE OR REPLACE FUNCTION trg_seed_balances_on_new_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM seed_balances_for_employee(NEW.id, NEW.workspace_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_profile_insert_seed_balances
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_seed_balances_on_new_employee();

-- ==========================================================
-- 4. Trigger: new category → seed balances for all employees
-- ==========================================================

CREATE OR REPLACE FUNCTION trg_seed_balances_on_new_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    PERFORM seed_balances_for_category(
      NEW.id, NEW.workspace_id, NEW.accrual_method, NEW.amount_value
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_category_insert_seed_balances
  AFTER INSERT ON time_off_categories
  FOR EACH ROW
  EXECUTE FUNCTION trg_seed_balances_on_new_category();

-- ==========================================================
-- 5. Trigger: category reactivated → seed missing balances
-- ==========================================================

CREATE OR REPLACE FUNCTION trg_seed_balances_on_category_reactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_active = false AND NEW.is_active = true THEN
    PERFORM seed_balances_for_category(
      NEW.id, NEW.workspace_id, NEW.accrual_method, NEW.amount_value
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_category_update_seed_balances
  AFTER UPDATE ON time_off_categories
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION trg_seed_balances_on_category_reactivate();

-- ==========================================================
-- 6. Patch create_time_off_record for unlimited categories
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
  v_total_days      integer;
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

  -- Look up category name and accrual method
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

  -- Check balance
  SELECT remaining_days INTO v_balance
  FROM employee_balances
  WHERE employee_id = p_employee_id AND category_id = p_category_id
  FOR UPDATE; -- lock the row for the transaction

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No balance allocated for this employee and category';
  END IF;

  -- Only check sufficiency for non-unlimited categories
  IF v_accrual_method <> 'unlimited' AND v_balance < v_total_days THEN
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

  -- Deduct from balance (skip for unlimited)
  IF v_accrual_method <> 'unlimited' THEN
    UPDATE employee_balances
    SET remaining_days = remaining_days - v_total_days
    WHERE employee_id = p_employee_id AND category_id = p_category_id;
  END IF;

  -- Return the created request
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

-- ==========================================================
-- 7. One-time backfill for existing data
-- ==========================================================

INSERT INTO employee_balances (employee_id, category_id, workspace_id, remaining_days)
SELECT
  p.id,
  c.id,
  p.workspace_id,
  CASE
    WHEN c.accrual_method = 'unlimited' THEN 0
    ELSE COALESCE(c.amount_value, 0)
  END
FROM profiles p
CROSS JOIN time_off_categories c
WHERE p.workspace_id = c.workspace_id
  AND p.status = 'active'
  AND c.is_active = true
ON CONFLICT (employee_id, category_id) DO NOTHING;

-- ==========================================================
-- Force PostgREST schema cache refresh
-- ==========================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
