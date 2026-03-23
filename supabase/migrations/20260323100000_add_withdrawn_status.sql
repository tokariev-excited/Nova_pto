-- Allow 'withdrawn' as a valid time_off_requests status
ALTER TABLE public.time_off_requests
  DROP CONSTRAINT time_off_requests_status_check;

ALTER TABLE public.time_off_requests
  ADD CONSTRAINT time_off_requests_status_check
  CHECK (status = ANY (ARRAY['pending','approved','rejected','withdrawn']));
