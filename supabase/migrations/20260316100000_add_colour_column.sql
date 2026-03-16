BEGIN;

ALTER TABLE time_off_categories
  ADD COLUMN IF NOT EXISTS colour text NOT NULL DEFAULT 'red';

ALTER TABLE time_off_categories
  ADD CONSTRAINT time_off_categories_colour_check
  CHECK (colour IN ('red', 'orange', 'green', 'blue', 'gray'));

NOTIFY pgrst, 'reload schema';

COMMIT;
