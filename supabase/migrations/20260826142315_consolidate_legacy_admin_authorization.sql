-- Keep the legacy helper for dependent payment policies, but make it delegate
-- to the single app-metadata-based platform-admin authority.
create or replace function public.faithbid_is_admin()
returns boolean
language sql
stable
set search_path = ''
as $function$
  select public.kb_is_platform_admin();
$function$;

revoke all on function public.faithbid_is_admin() from public, anon;
grant execute on function public.faithbid_is_admin() to authenticated, service_role;
