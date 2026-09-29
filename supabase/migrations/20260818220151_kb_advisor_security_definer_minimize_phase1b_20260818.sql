REVOKE EXECUTE ON FUNCTION public.kb_project_completion_vendor_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kb_get_vendor_reference_survey(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kb_submit_waitlist_application(jsonb) FROM anon, authenticated;
