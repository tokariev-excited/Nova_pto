CREATE TABLE time_off_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  request_type  text NOT NULL DEFAULT 'vacation'
                CHECK (request_type IN ('vacation','sick_leave','personal','bereavement','other')),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_requests_workspace ON time_off_requests(workspace_id);
CREATE INDEX idx_requests_workspace_status ON time_off_requests(workspace_id, status);
CREATE INDEX idx_requests_profile ON time_off_requests(profile_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Workspace members can read
CREATE POLICY "workspace_read" ON time_off_requests FOR SELECT USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);
-- Users can create own requests
CREATE POLICY "own_insert" ON time_off_requests FOR INSERT WITH CHECK (
  profile_id = auth.uid() AND workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
);
-- Admins can update (approve/reject)
CREATE POLICY "admin_update" ON time_off_requests FOR UPDATE USING (
  workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Users can delete own pending requests
CREATE POLICY "own_delete_pending" ON time_off_requests FOR DELETE USING (
  profile_id = auth.uid() AND status = 'pending'
);
