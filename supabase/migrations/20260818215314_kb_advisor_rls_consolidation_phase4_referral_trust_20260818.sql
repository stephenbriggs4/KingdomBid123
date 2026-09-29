-- FaithBid Advisor RLS consolidation phase 4: referrals and verification/reference tables.
-- Preserve current effective access exactly while collapsing permissive policy OR branches.

-- referral_rewards: owner/admin SELECT in one policy; admin writes split by action.
DROP POLICY IF EXISTS referral_rewards_admin_write ON public.referral_rewards;
DROP POLICY IF EXISTS "Users can view their own rewards" ON public.referral_rewards;
DROP POLICY IF EXISTS referral_rewards_select_owner ON public.referral_rewards;
DROP POLICY IF EXISTS kb_referral_rewards_admin_write ON public.referral_rewards;
ALTER POLICY kb_referral_rewards_owner_select
  ON public.referral_rewards
  USING ((user_id = (select auth.uid())) OR kb_is_platform_admin());
CREATE POLICY kb_referral_rewards_admin_insert
  ON public.referral_rewards FOR INSERT TO authenticated
  WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_referral_rewards_admin_update
  ON public.referral_rewards FOR UPDATE TO authenticated
  USING (kb_is_platform_admin()) WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_referral_rewards_admin_delete
  ON public.referral_rewards FOR DELETE TO authenticated
  USING (kb_is_platform_admin());

-- referrals SELECT: preserve referrer, both historical referred-user columns, and admin visibility.
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS referrals_select_parties ON public.referrals;
ALTER POLICY kb_referrals_referrer_select
  ON public.referrals
  USING (
    referrer_id = (select auth.uid())
    OR referred_id = (select auth.uid())
    OR referred_user_id = (select auth.uid())
    OR kb_is_platform_admin()
  );

-- Referrals UPDATE: keep admin path authenticated; keep service-role intent scoped only to service_role.
DROP POLICY IF EXISTS referrals_admin_write ON public.referrals;
DROP POLICY IF EXISTS "Service role can update referrals" ON public.referrals;
CREATE POLICY kb_referrals_service_role_update
  ON public.referrals FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

-- vendor_reference_responses: owner past-client visibility OR platform admin, one SELECT policy.
DROP POLICY IF EXISTS kb_vendor_reference_responses_admin_select ON public.vendor_reference_responses;
ALTER POLICY kb_vendor_reference_responses_owner_select_past_client
  ON public.vendor_reference_responses
  USING (
    kb_is_platform_admin()
    OR (
      vendor_id = (select auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.vendor_references vr
        WHERE vr.id = vendor_reference_responses.reference_id
          AND vr.vendor_id = (select auth.uid())
          AND vr.purpose = 'past_client'
      )
    )
  );

-- vendor_references: owner past-client visibility OR platform admin, one SELECT policy.
DROP POLICY IF EXISTS kb_vendor_references_admin_select ON public.vendor_references;
ALTER POLICY kb_vendor_references_owner_select_past_client
  ON public.vendor_references
  USING (
    kb_is_platform_admin()
    OR (vendor_id = (select auth.uid()) AND purpose = 'past_client')
  );

-- vendor_verifications: owner/admin SELECT in one policy; admin writes split by action.
DROP POLICY IF EXISTS kb_vendor_verifications_admin_all ON public.vendor_verifications;
ALTER POLICY kb_vendor_verifications_owner_select
  ON public.vendor_verifications
  USING ((user_id = (select auth.uid())) OR kb_is_platform_admin());
CREATE POLICY kb_vendor_verifications_admin_insert
  ON public.vendor_verifications FOR INSERT TO authenticated
  WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_vendor_verifications_admin_update
  ON public.vendor_verifications FOR UPDATE TO authenticated
  USING (kb_is_platform_admin()) WITH CHECK (kb_is_platform_admin());
CREATE POLICY kb_vendor_verifications_admin_delete
  ON public.vendor_verifications FOR DELETE TO authenticated
  USING (kb_is_platform_admin());

-- verification_requests: canonical owner/admin ALL policy already determines current effective access.
DROP POLICY IF EXISTS verification_requests_insert_self ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_self ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_admin_write ON public.verification_requests;
