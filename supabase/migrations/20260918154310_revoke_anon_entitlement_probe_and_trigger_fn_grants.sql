
-- The private-Marketplace entitlement helper is only evaluated by policies that
-- apply to the authenticated role, so anonymous callers had no legitimate need
-- to execute it (and could probe any profile id). The review-aggregate trigger
-- function is only ever fired by its trigger; PUBLIC needs no EXECUTE on it.
revoke execute on function public.kb_has_private_marketplace_access(uuid) from anon;
revoke execute on function public.kb_sync_vendor_review_aggregates() from public, anon, authenticated;
