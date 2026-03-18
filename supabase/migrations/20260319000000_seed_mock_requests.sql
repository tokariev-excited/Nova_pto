-- ============================================================
-- Migration: Seed 10 mock time-off requests for pagination testing
-- ============================================================

DO $$
DECLARE
  v_ws_id    uuid;
  v_emp1     record;
  v_emp2     record;
  v_emp3     record;
  v_emp4     record;
  v_cat1     uuid;  -- e.g. Vacation
  v_cat2     uuid;  -- e.g. Sick leave
  v_cat3     uuid;  -- e.g. another category
  v_cat1_name text;
  v_cat2_name text;
  v_cat3_name text;
BEGIN
  -- 1. Get the workspace
  SELECT id INTO v_ws_id FROM workspaces LIMIT 1;
  IF v_ws_id IS NULL THEN
    RAISE NOTICE 'No workspace found — skipping seed';
    RETURN;
  END IF;

  -- 2. Get up to 4 active employees
  SELECT id, first_name, last_name, email, avatar_url
    INTO v_emp1
    FROM profiles
   WHERE workspace_id = v_ws_id AND status = 'active'
   ORDER BY created_at
   LIMIT 1;

  SELECT id, first_name, last_name, email, avatar_url
    INTO v_emp2
    FROM profiles
   WHERE workspace_id = v_ws_id AND status = 'active'
   ORDER BY created_at
   OFFSET 1 LIMIT 1;

  SELECT id, first_name, last_name, email, avatar_url
    INTO v_emp3
    FROM profiles
   WHERE workspace_id = v_ws_id AND status = 'active'
   ORDER BY created_at
   OFFSET 2 LIMIT 1;

  SELECT id, first_name, last_name, email, avatar_url
    INTO v_emp4
    FROM profiles
   WHERE workspace_id = v_ws_id AND status = 'active'
   ORDER BY created_at
   OFFSET 3 LIMIT 1;

  -- Fall back if fewer than 4 employees
  IF v_emp2.id IS NULL THEN v_emp2 := v_emp1; END IF;
  IF v_emp3.id IS NULL THEN v_emp3 := v_emp1; END IF;
  IF v_emp4.id IS NULL THEN v_emp4 := v_emp2; END IF;

  -- 3. Get up to 3 active categories
  SELECT id, name INTO v_cat1, v_cat1_name
    FROM time_off_categories
   WHERE workspace_id = v_ws_id AND is_active = true
   ORDER BY sort_order
   LIMIT 1;

  SELECT id, name INTO v_cat2, v_cat2_name
    FROM time_off_categories
   WHERE workspace_id = v_ws_id AND is_active = true
   ORDER BY sort_order
   OFFSET 1 LIMIT 1;

  SELECT id, name INTO v_cat3, v_cat3_name
    FROM time_off_categories
   WHERE workspace_id = v_ws_id AND is_active = true
   ORDER BY sort_order
   OFFSET 2 LIMIT 1;

  -- Fall back if fewer than 3 categories
  IF v_cat2 IS NULL THEN v_cat2 := v_cat1; v_cat2_name := v_cat1_name; END IF;
  IF v_cat3 IS NULL THEN v_cat3 := v_cat1; v_cat3_name := v_cat1_name; END IF;

  IF v_emp1.id IS NULL OR v_cat1 IS NULL THEN
    RAISE NOTICE 'No employees or categories found — skipping seed';
    RETURN;
  END IF;

  -- Helper function to map category name → request_type
  -- (inline via CASE in each insert)

  -- 4. Insert 10 mock requests
  -- ── Request 1: Emp1, Cat1 (Vacation), Approved, past dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp1.id, v_ws_id, v_cat1,
    '2026-01-05', '2026-01-09',
    CASE lower(v_cat1_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'approved',
    'Family vacation — visiting relatives',
    trim(concat(v_emp1.first_name, ' ', v_emp1.last_name)),
    v_emp1.email,
    v_emp1.avatar_url
  );

  -- ── Request 2: Emp2, Cat2 (Sick leave), Approved, past dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp2.id, v_ws_id, v_cat2,
    '2026-01-20', '2026-01-21',
    CASE lower(v_cat2_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'approved',
    'Dentist appointment and recovery',
    trim(concat(v_emp2.first_name, ' ', v_emp2.last_name)),
    v_emp2.email,
    v_emp2.avatar_url
  );

  -- ── Request 3: Emp3, Cat1 (Vacation), Pending, current month
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp3.id, v_ws_id, v_cat1,
    '2026-03-23', '2026-03-27',
    CASE lower(v_cat1_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'pending',
    'Spring break trip',
    trim(concat(v_emp3.first_name, ' ', v_emp3.last_name)),
    v_emp3.email,
    v_emp3.avatar_url
  );

  -- ── Request 4: Emp1, Cat2 (Sick leave), Pending, current month
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp1.id, v_ws_id, v_cat2,
    '2026-03-16', '2026-03-17',
    CASE lower(v_cat2_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'pending',
    'Feeling under the weather',
    trim(concat(v_emp1.first_name, ' ', v_emp1.last_name)),
    v_emp1.email,
    v_emp1.avatar_url
  );

  -- ── Request 5: Emp4, Cat3, Rejected, past dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp4.id, v_ws_id, v_cat3,
    '2026-02-10', '2026-02-20',
    CASE lower(v_cat3_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'rejected',
    'Extended personal leave — conflicted with project deadline',
    trim(concat(v_emp4.first_name, ' ', v_emp4.last_name)),
    v_emp4.email,
    v_emp4.avatar_url
  );

  -- ── Request 6: Emp2, Cat1 (Vacation), Approved, future dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp2.id, v_ws_id, v_cat1,
    '2026-04-13', '2026-04-17',
    CASE lower(v_cat1_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'approved',
    'Annual leave — Europe trip',
    trim(concat(v_emp2.first_name, ' ', v_emp2.last_name)),
    v_emp2.email,
    v_emp2.avatar_url
  );

  -- ── Request 7: Emp3, Cat2 (Sick leave), Approved, past dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp3.id, v_ws_id, v_cat2,
    '2026-02-02', '2026-02-03',
    CASE lower(v_cat2_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'approved',
    'Flu — doctor recommended rest',
    trim(concat(v_emp3.first_name, ' ', v_emp3.last_name)),
    v_emp3.email,
    v_emp3.avatar_url
  );

  -- ── Request 8: Emp4, Cat1 (Vacation), Pending, future dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp4.id, v_ws_id, v_cat1,
    '2026-05-04', '2026-05-08',
    CASE lower(v_cat1_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'pending',
    'Wedding anniversary getaway',
    trim(concat(v_emp4.first_name, ' ', v_emp4.last_name)),
    v_emp4.email,
    v_emp4.avatar_url
  );

  -- ── Request 9: Emp1, Cat3, Approved, future dates
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp1.id, v_ws_id, v_cat3,
    '2026-06-01', '2026-06-05',
    CASE lower(v_cat3_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'approved',
    'Summer break — beach trip',
    trim(concat(v_emp1.first_name, ' ', v_emp1.last_name)),
    v_emp1.email,
    v_emp1.avatar_url
  );

  -- ── Request 10: Emp2, Cat2 (Sick leave), Pending, current month
  INSERT INTO time_off_requests
    (profile_id, workspace_id, category_id, start_date, end_date, request_type, status, comment, employee_name, employee_email, employee_avatar_url)
  VALUES (
    v_emp2.id, v_ws_id, v_cat2,
    '2026-03-18', '2026-03-19',
    CASE lower(v_cat2_name) WHEN 'vacation' THEN 'vacation' WHEN 'sick leave' THEN 'sick_leave' WHEN 'personal' THEN 'personal' WHEN 'bereavement' THEN 'bereavement' ELSE 'other' END,
    'pending',
    'Minor surgery follow-up',
    trim(concat(v_emp2.first_name, ' ', v_emp2.last_name)),
    v_emp2.email,
    v_emp2.avatar_url
  );

  RAISE NOTICE 'Seeded 10 mock time-off requests for workspace %', v_ws_id;
END;
$$;
