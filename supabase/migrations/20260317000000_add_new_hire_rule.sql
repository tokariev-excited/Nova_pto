-- Add new_hire_rule column to time_off_categories
-- Previously collected in UI but missing from database (data loss bug)

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS new_hire_rule text NOT NULL DEFAULT 'immediate';

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_new_hire_rule_check;

ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_new_hire_rule_check
  CHECK (new_hire_rule IN ('immediate', 'waiting_period'));

NOTIFY pgrst, 'reload schema';
