-- Remove only exact-equivalent RLS policy duplicates proven from pg_policies.
-- One equivalent policy remains in each case, so effective authorization is unchanged.

DROP POLICY IF EXISTS "Participants can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Public can read availability" ON public.vendor_availability;

DROP POLICY IF EXISTS "Vendors can insert own profile" ON public.vendors;
