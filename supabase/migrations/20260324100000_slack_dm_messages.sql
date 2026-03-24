-- ============================================================
-- Migration: slack_dm_messages — Track all admin DM refs per request
-- Enables updating every admin's DM when any admin acts on a request
-- ============================================================

CREATE TABLE slack_dm_messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            uuid NOT NULL REFERENCES time_off_requests(id) ON DELETE CASCADE,
  slack_installation_id uuid NOT NULL REFERENCES slack_installations(id) ON DELETE CASCADE,
  slack_user_id         text NOT NULL,
  channel_id            text NOT NULL,
  message_ts            text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, slack_user_id)
);

CREATE INDEX idx_slack_dm_messages_request ON slack_dm_messages(request_id);

ALTER TABLE slack_dm_messages ENABLE ROW LEVEL SECURITY;

-- Service-role only (edge functions use service role client)
-- No user-facing RLS policies needed
