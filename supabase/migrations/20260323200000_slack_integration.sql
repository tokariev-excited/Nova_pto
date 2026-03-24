-- ============================================================
-- Migration: Slack Integration
-- Creates tables for Slack app installation, user mapping,
-- interaction idempotency, and a bot-callable approval RPC.
-- ============================================================

BEGIN;

-- ==========================================================
-- 1. slack_installations — OAuth installation data
-- ==========================================================

CREATE TABLE slack_installations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slack_team_id   text NOT NULL,
  slack_team_name text,
  bot_token       text NOT NULL,
  bot_user_id     text NOT NULL,
  installed_by    uuid NOT NULL REFERENCES profiles(id),
  scope           text,
  raw_response    jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- One Slack team can only connect to one Nova workspace
ALTER TABLE slack_installations
  ADD CONSTRAINT slack_installations_team_unique UNIQUE (slack_team_id);

-- One Nova workspace can only have one Slack installation
ALTER TABLE slack_installations
  ADD CONSTRAINT slack_installations_workspace_unique UNIQUE (workspace_id);

CREATE INDEX idx_slack_installations_team ON slack_installations(slack_team_id);

ALTER TABLE slack_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY slack_installations_select ON slack_installations
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY slack_installations_insert ON slack_installations
  FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id() AND is_workspace_admin());

CREATE POLICY slack_installations_update ON slack_installations
  FOR UPDATE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

CREATE POLICY slack_installations_delete ON slack_installations
  FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

CREATE TRIGGER set_updated_at_slack_installations
  BEFORE UPDATE ON slack_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 2. slack_user_mappings — Slack User ID ↔ Profile link
-- ==========================================================

CREATE TABLE slack_user_mappings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_installation_id uuid NOT NULL REFERENCES slack_installations(id) ON DELETE CASCADE,
  slack_user_id         text NOT NULL,
  profile_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linked_via            text NOT NULL DEFAULT 'email_match'
    CHECK (linked_via IN ('email_match', 'manual')),
  linked_at             timestamptz NOT NULL DEFAULT now()
);

-- Each Slack user maps to exactly one profile per installation
ALTER TABLE slack_user_mappings
  ADD CONSTRAINT slack_user_mappings_user_unique UNIQUE (slack_installation_id, slack_user_id);

-- Each profile maps to exactly one Slack user per installation
ALTER TABLE slack_user_mappings
  ADD CONSTRAINT slack_user_mappings_profile_unique UNIQUE (slack_installation_id, profile_id);

CREATE INDEX idx_slack_user_mappings_slack ON slack_user_mappings(slack_user_id, slack_installation_id);
CREATE INDEX idx_slack_user_mappings_profile ON slack_user_mappings(profile_id);

ALTER TABLE slack_user_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY slack_user_mappings_select ON slack_user_mappings
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY slack_user_mappings_insert ON slack_user_mappings
  FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY slack_user_mappings_delete ON slack_user_mappings
  FOR DELETE USING (workspace_id = get_user_workspace_id() AND is_workspace_admin());

-- ==========================================================
-- 3. slack_interaction_log — Idempotency for button clicks
-- ==========================================================

CREATE TABLE slack_interaction_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id  text NOT NULL,
  action_type     text NOT NULL CHECK (action_type IN ('approve', 'reject', 'submit')),
  request_id      uuid REFERENCES time_off_requests(id) ON DELETE SET NULL,
  processed_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  result          jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE slack_interaction_log
  ADD CONSTRAINT slack_interaction_log_unique UNIQUE (interaction_id);

CREATE INDEX idx_slack_interaction_log_lookup ON slack_interaction_log(interaction_id);

ALTER TABLE slack_interaction_log ENABLE ROW LEVEL SECURITY;

-- Service-role only (edge functions use service role client)
-- No user-facing RLS policies needed

-- ==========================================================
-- 4. New columns on time_off_requests for Slack message tracking
-- ==========================================================

ALTER TABLE time_off_requests
  ADD COLUMN IF NOT EXISTS slack_message_ts text,
  ADD COLUMN IF NOT EXISTS slack_channel_id text;

-- ==========================================================
-- 5. approve_time_off_request_bot — Bot-callable approval RPC
--    Same logic as approve_time_off_request but accepts
--    p_admin_profile_id instead of using auth.uid()
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
-- 6. reject_time_off_request_bot — Bot-callable rejection RPC
-- ==========================================================

CREATE OR REPLACE FUNCTION reject_time_off_request_bot(
  p_request_id       uuid,
  p_admin_profile_id uuid,
  p_rejection_reason text
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
BEGIN
  -- Verify the admin profile exists and is actually an admin
  SELECT role, workspace_id INTO v_admin_role, v_admin_workspace
  FROM profiles
  WHERE id = p_admin_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin profile not found';
  END IF;

  IF v_admin_role <> 'admin' THEN
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

  -- Verify the request belongs to the admin's workspace
  IF v_request.workspace_id <> v_admin_workspace THEN
    RAISE EXCEPTION 'Request does not belong to your workspace';
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

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

COMMIT;
