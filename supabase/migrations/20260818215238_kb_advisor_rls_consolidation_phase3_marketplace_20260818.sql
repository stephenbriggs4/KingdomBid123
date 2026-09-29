-- FaithBid Advisor RLS consolidation phase 3: marketplace support tables.
-- Recompose overlapping permissive policies into one policy per role/action while preserving
-- the current effective OR semantics.

-- disputes: preserve raised_by read access without granting raised_by write access.
DROP POLICY IF EXISTS kb_disputes_involved ON public.disputes;
DROP POLICY IF EXISTS "Participants can read own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
CREATE POLICY kb_disputes_select_involved
  ON public.disputes FOR SELECT TO authenticated
  USING (
    church_id = (select auth.uid())
    OR vendor_id = (select auth.uid())
    OR raised_by = (select auth.uid())
    OR kb_is_platform_admin()
  );
CREATE POLICY kb_disputes_insert_involved
  ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (
    church_id = (select auth.uid())
    OR vendor_id = (select auth.uid())
    OR kb_is_platform_admin()
  );
CREATE POLICY kb_disputes_update_involved
  ON public.disputes FOR UPDATE TO authenticated
  USING (
    church_id = (select auth.uid())
    OR vendor_id = (select auth.uid())
    OR kb_is_platform_admin()
  )
  WITH CHECK (
    church_id = (select auth.uid())
    OR vendor_id = (select auth.uid())
    OR kb_is_platform_admin()
  );
CREATE POLICY kb_disputes_delete_involved
  ON public.disputes FOR DELETE TO authenticated
  USING (
    church_id = (select auth.uid())
    OR vendor_id = (select auth.uid())
    OR kb_is_platform_admin()
  );

-- geo taxonomy: anon sees active rows; authenticated users see active rows and admins see all.
DROP POLICY IF EXISTS geo_markets_admin_all ON public.geo_markets;
DROP POLICY IF EXISTS geo_markets_public_active_select ON public.geo_markets;
CREATE POLICY geo_markets_anon_active_select
  ON public.geo_markets FOR SELECT TO anon USING (active);
CREATE POLICY geo_markets_auth_select
  ON public.geo_markets FOR SELECT TO authenticated USING (active OR kb_is_platform_admin());
CREATE POLICY geo_markets_admin_insert
  ON public.geo_markets FOR INSERT TO authenticated WITH CHECK (kb_is_platform_admin());
CREATE POLICY geo_markets_admin_update
  ON public.geo_markets FOR UPDATE TO authenticated
  USING (kb_is_platform_admin()) WITH CHECK (kb_is_platform_admin());
CREATE POLICY geo_markets_admin_delete
  ON public.geo_markets FOR DELETE TO authenticated USING (kb_is_platform_admin());

DROP POLICY IF EXISTS geo_places_admin_all ON public.geo_places;
DROP POLICY IF EXISTS geo_places_public_active_select ON public.geo_places;
CREATE POLICY geo_places_anon_active_select
  ON public.geo_places FOR SELECT TO anon USING (active);
CREATE POLICY geo_places_auth_select
  ON public.geo_places FOR SELECT TO authenticated USING (active OR kb_is_platform_admin());
CREATE POLICY geo_places_admin_insert
  ON public.geo_places FOR INSERT TO authenticated WITH CHECK (kb_is_platform_admin());
CREATE POLICY geo_places_admin_update
  ON public.geo_places FOR UPDATE TO authenticated
  USING (kb_is_platform_admin()) WITH CHECK (kb_is_platform_admin());
CREATE POLICY geo_places_admin_delete
  ON public.geo_places FOR DELETE TO authenticated USING (kb_is_platform_admin());

-- hire confirmations: canonical involved/admin ALL policy already supersedes legacy layers.
DROP POLICY IF EXISTS hire_confirmations_admin_write ON public.hire_confirmations;
DROP POLICY IF EXISTS hire_confirmations_select_participants ON public.hire_confirmations;

-- project activity: canonical involved/admin ALL policy supersedes old INSERT/SELECT copies.
DROP POLICY IF EXISTS project_activity_feed_insert_related ON public.project_activity_feed;
DROP POLICY IF EXISTS project_activity_feed_select_related ON public.project_activity_feed;

-- signup counter: public SELECT remains; admin writes are action-specific to avoid SELECT overlap.
DROP POLICY IF EXISTS signup_counter_admin_write ON public.signup_counter;
DROP POLICY IF EXISTS signup_counter_read_all ON public.signup_counter;
DROP POLICY IF EXISTS kb_signup_counter_admin_write ON public.signup_counter;
CREATE POLICY kb_signup_counter_admin_insert
  ON public.signup_counter FOR INSERT TO authenticated WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_signup_counter_admin_update
  ON public.signup_counter FOR UPDATE TO authenticated
  USING (kb_is_platform_admin()) WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_signup_counter_admin_delete
  ON public.signup_counter FOR DELETE TO authenticated USING (kb_is_platform_admin());

-- vendor availability: public read is intentionally separate from authenticated owner/admin writes.
DROP POLICY IF EXISTS "Vendors can manage their own availability" ON public.vendor_availability;
DROP POLICY IF EXISTS vendor_availability_owner_write ON public.vendor_availability;
DROP POLICY IF EXISTS vendor_availability_read_all ON public.vendor_availability;
DROP POLICY IF EXISTS kb_vendor_availability_owner_write ON public.vendor_availability;
CREATE POLICY kb_vendor_availability_owner_insert
  ON public.vendor_availability FOR INSERT TO authenticated
  WITH CHECK (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_availability.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );
CREATE POLICY kb_vendor_availability_owner_update
  ON public.vendor_availability FOR UPDATE TO authenticated
  USING (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_availability.vendor_id
        AND v.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_availability.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );
CREATE POLICY kb_vendor_availability_owner_delete
  ON public.vendor_availability FOR DELETE TO authenticated
  USING (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_availability.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );

-- vendor service areas: keep the SELECT policy's public-launch branch, split owner/admin writes.
DROP POLICY IF EXISTS vendor_service_areas_write_own ON public.vendor_service_areas;
CREATE POLICY vendor_service_areas_insert_own
  ON public.vendor_service_areas FOR INSERT TO authenticated
  WITH CHECK (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_areas.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );
CREATE POLICY vendor_service_areas_update_own
  ON public.vendor_service_areas FOR UPDATE TO authenticated
  USING (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_areas.vendor_id
        AND v.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_areas.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );
CREATE POLICY vendor_service_areas_delete_own
  ON public.vendor_service_areas FOR DELETE TO authenticated
  USING (
    kb_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_areas.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );

-- vendors INSERT: canonical authenticated owner/admin policy already determines current effective access.
DROP POLICY IF EXISTS "Users can insert own vendor row" ON public.vendors;
DROP POLICY IF EXISTS vendors_insert_self ON public.vendors;
