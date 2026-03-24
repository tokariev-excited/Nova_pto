-- =============================================================
-- Single-workspace constraint: one active profile per email globally
-- =============================================================

-- Partial unique index: only one non-deleted profile per email across all workspaces
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_active_unique
  ON profiles (email)
  WHERE status != 'deleted';

-- =============================================================
-- Workspace deletion: RLS policy (defense-in-depth)
-- =============================================================

-- Allow workspace owner to delete their own workspace via anon key
CREATE POLICY workspaces_delete_owner ON workspaces
  FOR DELETE USING (owner_id = auth.uid());
