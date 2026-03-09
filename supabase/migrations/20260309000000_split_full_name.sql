ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;

UPDATE profiles
SET
  first_name = CASE WHEN full_name IS NOT NULL AND full_name != ''
    THEN split_part(full_name, ' ', 1) ELSE NULL END,
  last_name = CASE WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0
    THEN substring(full_name from position(' ' in full_name) + 1) ELSE NULL END
WHERE full_name IS NOT NULL;

ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;
