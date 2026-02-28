-- Fix working_hours constraint to allow non-working days with equal start/end times
-- The default user trigger inserts weekend rows as 00:00 -> 00:00 with is_working_day=false.
-- Previous constraint (end_time > start_time) rejected those rows and caused user creation to fail.

ALTER TABLE working_hours
DROP CONSTRAINT IF EXISTS valid_time_range;

ALTER TABLE working_hours
ADD CONSTRAINT valid_time_range
CHECK (
  is_working_day = false
  OR end_time > start_time
);
