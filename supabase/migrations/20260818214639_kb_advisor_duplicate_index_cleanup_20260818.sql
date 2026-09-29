-- FaithBid Supabase Advisor hardening: remove only proven duplicate indexes.
-- Preserve constraint-backed canonical indexes wherever present.

-- conversation_user_state
DROP INDEX IF EXISTS public.cus_convo_idx;
DROP INDEX IF EXISTS public.cus_user_idx;
DROP INDEX IF EXISTS public.idx_conversation_user_state_user;
DROP INDEX IF EXISTS public.conversation_user_state_unique_idx;
DROP INDEX IF EXISTS public.idx_conversation_user_state_unique;

-- conversations
DROP INDEX IF EXISTS public.conversations_church_idx;
DROP INDEX IF EXISTS public.conversations_vendor_idx;

-- project_activity_feed
DROP INDEX IF EXISTS public.paf_church_idx;
DROP INDEX IF EXISTS public.paf_project_idx;

-- project_vendor_links
DROP INDEX IF EXISTS public.pvl_church_idx;
DROP INDEX IF EXISTS public.pvl_project_idx;
DROP INDEX IF EXISTS public.pvl_vendor_user_idx;
DROP INDEX IF EXISTS public.project_vendor_links_project_vendor_idx;
DROP INDEX IF EXISTS public.project_vendor_links_project_vendor_user_uidx;

-- saved_projects
DROP INDEX IF EXISTS public.saved_projects_project_idx;
DROP INDEX IF EXISTS public.saved_projects_user_idx;
DROP INDEX IF EXISTS public.saved_projects_user_project_idx;

-- saved_vendors
DROP INDEX IF EXISTS public.saved_vendors_user_vendor_idx;

-- vendor_availability: two independent UNIQUE constraints covered the same columns.
-- Keep the original vendor_availability_vendor_id_date_key constraint.
ALTER TABLE public.vendor_availability
  DROP CONSTRAINT IF EXISTS vendor_availability_vendor_date_unique;

-- vendor_reference_responses
DROP INDEX IF EXISTS public.vendor_reference_responses_reference_idx;

-- vendor_references
DROP INDEX IF EXISTS public.vendor_references_token_idx;
