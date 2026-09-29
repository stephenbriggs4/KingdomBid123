-- Legacy referral-code resolver is not used by the current app or database policies/functions.
-- It has no caller authorization gate, so remove the signed-in privileged RPC surface.
REVOKE EXECUTE ON FUNCTION public.kb_resolve_referrer_by_code(text) FROM PUBLIC, anon, authenticated;
