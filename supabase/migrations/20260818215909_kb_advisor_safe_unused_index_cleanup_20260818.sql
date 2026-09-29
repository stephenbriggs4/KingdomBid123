-- Remove only unused indexes proven structurally redundant to stronger/full indexes.

-- Exact duplicates of unique indexes/constraints.
DROP INDEX IF EXISTS public.project_payment_installments_plan_idx;
DROP INDEX IF EXISTS public.vendor_availability_vendor_date_idx;
DROP INDEX IF EXISTS public.vendor_ref_resp_reference_idx;
DROP INDEX IF EXISTS public.waitlist_referral_idx;

-- Single-column indexes already covered as the leading column of stronger composite unique indexes.
DROP INDEX IF EXISTS public.idx_conversation_user_state_conversation_id;
DROP INDEX IF EXISTS public.idx_project_vendor_links_project_id;
DROP INDEX IF EXISTS public.vendor_invites_project_idx;

-- Old partial IS NOT NULL helpers superseded by the new full FK-covering indexes.
DROP INDEX IF EXISTS public.profiles_place_idx;
DROP INDEX IF EXISTS public.projects_project_place_idx;
DROP INDEX IF EXISTS public.vendors_base_place_idx;
DROP INDEX IF EXISTS public.waitlist_place_idx;
