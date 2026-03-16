-- ============================================================
-- Migration: Expand granting_frequency CHECK constraint
-- Adds weekly, bi_weekly, quarterly options for periodic accrual
-- ============================================================

BEGIN;

ALTER TABLE time_off_categories
  DROP CONSTRAINT IF EXISTS time_off_categories_granting_frequency_check;

ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_granting_frequency_check
  CHECK (granting_frequency IN ('yearly', 'hire_anniversary', 'monthly', 'weekly', 'bi_weekly', 'quarterly'));

COMMIT;
