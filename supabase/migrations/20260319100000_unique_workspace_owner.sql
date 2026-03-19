-- Prevent duplicate workspaces from concurrent founder flows across tabs.
-- Each user should own exactly one workspace.
ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_owner_id_unique UNIQUE (owner_id);
