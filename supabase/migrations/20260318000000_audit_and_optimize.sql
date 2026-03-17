-- ============================================================
-- Migration: Database audit & optimization
-- Date: 2026-03-18
-- Fixes: data integrity, security, performance, uniqueness
-- ============================================================

BEGIN;

-- ==========================================================
-- PHASE 1: CRITICAL — Data Integrity & Security
-- ==========================================================

-- 1.1 CHECK constraint on profiles.role
-- Safeguard: fix any invalid rows first
UPDATE profiles SET role = 'user'
WHERE role NOT IN ('admin', 'user');

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'user'));

-- 1.2 UNIQUE constraint on departments(workspace_id, name)
-- De-duplicate: keep oldest department, reassign profiles from duplicates
DO $$
DECLARE
  dup record;
BEGIN
  FOR dup IN
    SELECT workspace_id, name,
           (array_agg(id ORDER BY created_at ASC))[1] AS keep_id,
           array_remove(
             array_agg(id ORDER BY created_at ASC),
             (array_agg(id ORDER BY created_at ASC))[1]
           ) AS remove_ids
    FROM departments
    GROUP BY workspace_id, name
    HAVING count(*) > 1
  LOOP
    UPDATE profiles SET department_id = dup.keep_id
    WHERE department_id = ANY(dup.remove_ids);

    DELETE FROM departments WHERE id = ANY(dup.remove_ids);
  END LOOP;
END $$;

ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS departments_workspace_name_unique;

ALTER TABLE departments
  ADD CONSTRAINT departments_workspace_name_unique
  UNIQUE (workspace_id, name);

-- 1.3 Sync trigger for denormalized time_off_requests fields
CREATE OR REPLACE FUNCTION sync_request_employee_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.first_name IS DISTINCT FROM NEW.first_name)
     OR (OLD.last_name IS DISTINCT FROM NEW.last_name)
     OR (OLD.email IS DISTINCT FROM NEW.email)
     OR (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  THEN
    UPDATE time_off_requests
    SET
      employee_name       = coalesce(trim(concat(NEW.first_name, ' ', NEW.last_name)), ''),
      employee_email      = NEW.email,
      employee_avatar_url = NEW.avatar_url
    WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_to_requests ON profiles;

CREATE TRIGGER sync_profile_to_requests
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_request_employee_fields();

-- Backfill any existing rows that are out of sync
UPDATE time_off_requests r
SET
  employee_name       = coalesce(trim(concat(p.first_name, ' ', p.last_name)), ''),
  employee_email      = p.email,
  employee_avatar_url = p.avatar_url
FROM profiles p
WHERE r.profile_id = p.id
  AND (
    r.employee_name IS DISTINCT FROM coalesce(trim(concat(p.first_name, ' ', p.last_name)), '')
    OR r.employee_email IS DISTINCT FROM p.email
    OR r.employee_avatar_url IS DISTINCT FROM p.avatar_url
  );

-- 1.4 Tighten storage bucket policies
-- Drop existing overly-permissive write/delete policies
DROP POLICY IF EXISTS storage_logos_insert ON storage.objects;
DROP POLICY IF EXISTS storage_logos_update ON storage.objects;
DROP POLICY IF EXISTS storage_logos_delete ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_insert ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_update ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_delete ON storage.objects;

-- Logos: only workspace admins can manage files in their workspace folder
-- Upload path: {workspace_id}/{timestamp}.{ext}
CREATE POLICY storage_logos_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND is_workspace_admin()
    AND split_part(name, '/', 1) = get_user_workspace_id()::text
  );

CREATE POLICY storage_logos_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND is_workspace_admin()
    AND split_part(name, '/', 1) = get_user_workspace_id()::text
  );

CREATE POLICY storage_logos_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND is_workspace_admin()
    AND split_part(name, '/', 1) = get_user_workspace_id()::text
  );

-- Avatars: users manage own folder, admins manage employees folder
-- Own avatar path: {user_id}/{timestamp}.{ext}
-- Employee avatar path: employees/{timestamp}.{ext}
CREATE POLICY storage_avatars_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR (split_part(name, '/', 1) = 'employees' AND is_workspace_admin())
    )
  );

CREATE POLICY storage_avatars_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR (split_part(name, '/', 1) = 'employees' AND is_workspace_admin())
    )
  );

CREATE POLICY storage_avatars_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR (split_part(name, '/', 1) = 'employees' AND is_workspace_admin())
    )
  );

-- ==========================================================
-- PHASE 2: PERFORMANCE — Index Optimization
-- ==========================================================

-- 2.1 Composite index for employee list + count queries
-- Covers: .eq("workspace_id", X).eq("status", Y).order("created_at", desc)
CREATE INDEX IF NOT EXISTS idx_profiles_workspace_status_created
  ON profiles (workspace_id, status, created_at DESC);

-- Drop single-column index now covered by composite
DROP INDEX IF EXISTS idx_profiles_workspace;

-- 2.2 Drop redundant prefix indexes
-- Each is the leftmost prefix of an existing composite index
DROP INDEX IF EXISTS idx_holidays_workspace;
DROP INDEX IF EXISTS idx_time_off_categories_workspace;
DROP INDEX IF EXISTS idx_requests_workspace;

-- ==========================================================
-- PHASE 3: CLEANUP — Uniqueness Constraints
-- ==========================================================

-- 3.1 UNIQUE on time_off_categories(workspace_id, name)
DO $$
DECLARE
  dup record;
BEGIN
  FOR dup IN
    SELECT workspace_id, name,
           (array_agg(id ORDER BY created_at ASC))[1] AS keep_id,
           array_remove(
             array_agg(id ORDER BY created_at ASC),
             (array_agg(id ORDER BY created_at ASC))[1]
           ) AS remove_ids
    FROM time_off_categories
    GROUP BY workspace_id, name
    HAVING count(*) > 1
  LOOP
    DELETE FROM time_off_categories WHERE id = ANY(dup.remove_ids);
  END LOOP;
END $$;

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_workspace_name_unique;

ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_workspace_name_unique
  UNIQUE (workspace_id, name);

-- 3.2 UNIQUE on holidays(workspace_id, date, name)
DO $$
DECLARE
  dup record;
BEGIN
  FOR dup IN
    SELECT workspace_id, date, name,
           (array_agg(id ORDER BY created_at ASC))[1] AS keep_id,
           array_remove(
             array_agg(id ORDER BY created_at ASC),
             (array_agg(id ORDER BY created_at ASC))[1]
           ) AS remove_ids
    FROM holidays
    GROUP BY workspace_id, date, name
    HAVING count(*) > 1
  LOOP
    DELETE FROM holidays WHERE id = ANY(dup.remove_ids);
  END LOOP;
END $$;

ALTER TABLE holidays
  DROP CONSTRAINT IF EXISTS holidays_workspace_date_name_unique;

ALTER TABLE holidays
  ADD CONSTRAINT holidays_workspace_date_name_unique
  UNIQUE (workspace_id, date, name);

-- ==========================================================
-- Force PostgREST schema cache refresh
-- ==========================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
