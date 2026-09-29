-- FaithBid Advisor RLS consolidation phase 1.
-- Remove legacy PUBLIC policy layers where authenticated canonical policies are a semantic superset,
-- and merge intentionally distinct authenticated SELECT predicates rather than dropping access.

-- Admin-only application tables: kb_is_platform_admin() is a superset of the legacy is_admin()
-- metadata check for authenticated users.
DROP POLICY IF EXISTS ambassador_admin_all ON public.ambassador_applications;
DROP POLICY IF EXISTS partner_admin_all ON public.partner_applications;

-- early_signups: preserve the legacy admin ALL capability, but consolidate to one authenticated policy.
DROP POLICY IF EXISTS early_signups_admin_all ON public.early_signups;
DROP POLICY IF EXISTS kb_early_signups_admin_select ON public.early_signups;
DROP POLICY IF EXISTS kb_early_signups_admin_update ON public.early_signups;
CREATE POLICY kb_early_signups_admin_all
  ON public.early_signups
  FOR ALL
  TO authenticated
  USING (kb_is_platform_admin())
  WITH CHECK (kb_is_platform_admin());

-- Owner tables: newer authenticated policies already include owner access plus platform-admin access.
DROP POLICY IF EXISTS notification_prefs_owner ON public.notification_prefs;
DROP POLICY IF EXISTS saved_vendors_owner ON public.saved_vendors;

-- profiles INSERT: canonical policy is identical for owners and additionally permits platform admin.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- vendor endorsements INSERT: remove legacy PUBLIC duplicate; authenticated equivalent remains.
DROP POLICY IF EXISTS vendor_endorsements_insert_auth ON public.vendor_endorsements;

-- platform_settings: public SELECT remains intentionally available, while admin writes are split
-- from SELECT so authenticated admins do not execute two permissive SELECT policies.
DROP POLICY IF EXISTS kb_platform_settings_admin_write ON public.platform_settings;
CREATE POLICY kb_platform_settings_admin_insert
  ON public.platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_platform_settings_admin_update
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (kb_is_platform_admin())
  WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_platform_settings_admin_delete
  ON public.platform_settings
  FOR DELETE
  TO authenticated
  USING (kb_is_platform_admin());

-- projects SELECT: preserve both canonical marketplace visibility and explicit invite/link visibility
-- in one authenticated policy.
DROP POLICY IF EXISTS "vendors can view projects they are invited to" ON public.projects;
ALTER POLICY kb_projects_select_authenticated
  ON public.projects
  USING (
    kb_is_platform_admin()
    OR hired_vendor_id = (select auth.uid())
    OR (
      kb_marketplace_public()
      AND (status = 'open' OR church_id = (select auth.uid()))
    )
    OR (
      status = 'open'
      AND (
        EXISTS (
          SELECT 1
          FROM public.vendor_invites vi
          WHERE vi.project_id = projects.id
            AND vi.vendor_user_id = (select auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.project_vendor_links pvl
          WHERE pvl.project_id = projects.id
            AND pvl.vendor_user_id = (select auth.uid())
        )
      )
    )
  );
