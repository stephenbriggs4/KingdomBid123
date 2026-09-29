-- Reduce SECURITY DEFINER exposure where elevation is not required.

-- Pure/read-only helpers can safely run with caller privileges.
ALTER FUNCTION public.faithbid_allocate_platform_fee_cents(bigint, bigint[], text) SECURITY INVOKER;
ALTER FUNCTION public.faithbid_quote_platform_fee_cents(bigint, text) SECURITY INVOKER;
ALTER FUNCTION public.faithbid_is_admin() SECURITY INVOKER;
ALTER FUNCTION public.is_admin() SECURITY INVOKER;

-- Trigger-only function is not a client RPC surface.
REVOKE EXECUTE ON FUNCTION public.kb_project_completion_vendor_history() FROM PUBLIC;

-- Legacy direct RPC surfaces superseded by v2. Keep functions for internal/owner calls,
-- but remove direct anon/authenticated exposure inherited through PUBLIC.
REVOKE EXECUTE ON FUNCTION public.kb_get_vendor_reference_survey(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.kb_submit_waitlist_application(jsonb) FROM PUBLIC;
