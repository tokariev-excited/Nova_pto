-- ============================================================
-- Migration 002: Fix RLS infinite recursion + full backend setup
-- ============================================================
-- Root cause: profiles RLS policies sub-select FROM profiles,
-- causing Postgres to re-evaluate the same policy → infinite loop.
-- Fix: SECURITY DEFINER helper functions that bypass RLS.
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. SECURITY DEFINER helper functions (bypass RLS)
-- ==========================================================

CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_workspace_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ==========================================================
-- 2. Ensure required columns exist on profiles
-- ==========================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date date;

-- Status check constraint (idempotent via IF NOT EXISTS-style DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('active', 'inactive', 'deleted'));
  END IF;
END $$;

-- ==========================================================
-- 3. Ensure departments table exists
-- ==========================================================

CREATE TABLE IF NOT EXISTS departments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- FK from profiles.department_id → departments.id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_department_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==========================================================
-- 4. Drop ALL existing RLS policies (clean slate)
-- ==========================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'workspaces', 'departments', 'time_off_requests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ==========================================================
-- 5. Enable RLS on all tables
-- ==========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 6. profiles policies
-- ==========================================================

-- Fast path: user can always read own profile (no sub-select → no recursion)
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

-- Read all profiles in same workspace via helper function
CREATE POLICY profiles_select_workspace ON profiles
  FOR SELECT USING (workspace_id = get_user_workspace_id());

-- Insert own profile (founder flow)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Update own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin can update any profile in workspace (e.g. change status)
CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

-- ==========================================================
-- 7. workspaces policies
-- ==========================================================

-- Members can read their workspace
CREATE POLICY workspaces_select_member ON workspaces
  FOR SELECT USING (id = get_user_workspace_id());

-- Any authenticated user can create a workspace (founder flow — no profile yet)
CREATE POLICY workspaces_insert_authenticated ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin can update workspace
CREATE POLICY workspaces_update_admin ON workspaces
  FOR UPDATE USING (
    id = get_user_workspace_id() AND is_workspace_admin()
  );

-- ==========================================================
-- 8. departments policies
-- ==========================================================

CREATE POLICY departments_select_workspace ON departments
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY departments_insert_admin ON departments
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

CREATE POLICY departments_update_admin ON departments
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

CREATE POLICY departments_delete_admin ON departments
  FOR DELETE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

-- ==========================================================
-- 9. time_off_requests policies (fixed — no sub-selects)
-- ==========================================================

-- Workspace members can read all requests in their workspace
CREATE POLICY requests_select_workspace ON time_off_requests
  FOR SELECT USING (workspace_id = get_user_workspace_id());

-- Users can create requests for themselves
CREATE POLICY requests_insert_own ON time_off_requests
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() AND workspace_id = get_user_workspace_id()
  );

-- Admins can update requests (approve/reject)
CREATE POLICY requests_update_admin ON time_off_requests
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

-- Users can delete own pending requests
CREATE POLICY requests_delete_own_pending ON time_off_requests
  FOR DELETE USING (
    profile_id = auth.uid() AND status = 'pending'
  );

-- ==========================================================
-- 10. Storage buckets + policies
-- ==========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for logos
CREATE POLICY storage_logos_select ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Authenticated users can manage logos
CREATE POLICY storage_logos_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY storage_logos_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY storage_logos_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

-- Public read for avatars
CREATE POLICY storage_avatars_select ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can manage avatars
CREATE POLICY storage_avatars_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY storage_avatars_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY storage_avatars_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

COMMIT;
