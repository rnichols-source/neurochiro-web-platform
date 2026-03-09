-- RESTORATION SCRIPT: Set all doctors to 'verified' to restore the full directory
-- This reverts the bulk 'hidden' update and ensures all ~130+ users are visible.

UPDATE public.doctors
SET verification_status = 'verified'
WHERE verification_status = 'hidden';

-- Verify the restoration
SELECT count(*) as total_verified_doctors
FROM public.doctors
WHERE verification_status = 'verified';
