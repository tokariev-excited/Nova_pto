-- ============================================================
-- Migration: Deep Audit Fixes
-- P0: Restrict comment/rejection_reason visibility for non-admin/non-owner
-- P2: Performance indexes
-- ============================================================

-- ============================================================
-- P0: Create a secure view that masks comment/rejection_reason
-- for users who are neither the request owner nor a workspace admin.
-- The underlying table's RLS still filters by workspace.
-- ============================================================

CREATE OR REPLACE VIEW time_off_requests_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  profile_id,
  workspace_id,
  category_id,
  employee_name,
  employee_email,
  employee_avatar_url,
  start_date,
  end_date,
  start_period,
  end_period,
  total_days,
  request_type,
  status,
  created_at,
  updated_at,
  CASE
    WHEN profile_id = auth.uid() OR is_workspace_admin() THEN comment
    ELSE NULL
  END AS comment,
  CASE
    WHEN profile_id = auth.uid() OR is_workspace_admin() THEN rejection_reason
    ELSE NULL
  END AS rejection_reason
FROM time_off_requests;

GRANT SELECT ON time_off_requests_safe TO authenticated;

-- ============================================================
-- P2: Add index for admin request list sorting by created_at
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_requests_workspace_created
  ON time_off_requests (workspace_id, created_at DESC);

-- ============================================================
-- P2: Add non-partial index on profiles(email) for auth/invite lookups
-- The existing partial unique index (WHERE status != 'deleted')
-- cannot serve general email lookups.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles (email);

-- ============================================================
-- Force PostgREST schema cache refresh
-- ============================================================
NOTIFY pgrst, 'reload schema';
