-- ============================================================
-- Migration: Atomic replace_imported_holidays function
-- Wipes ALL imported (is_custom = false) holidays for a workspace
-- and inserts a new set in a single transaction.
-- ============================================================

BEGIN;

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

COMMIT;
