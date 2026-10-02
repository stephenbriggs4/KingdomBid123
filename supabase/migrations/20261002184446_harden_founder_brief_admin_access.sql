-- The founder brief is an internal aggregate. Historical composition functions
-- remain callable by the current SECURITY DEFINER owner, but are not public API.

revoke all on function public.kb_admin_get_founder_brief_active_bids_20260824_v1(timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.kb_admin_get_founder_brief_channel_20260824_v2(timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.kb_admin_get_founder_brief_liquidity_20260824_v1(timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.kb_admin_get_founder_brief_provenance_20260824_v1(timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.kb_admin_get_founder_brief_staleness_20260824_v1(timestamptz)
  from public, anon, authenticated, service_role;

alter function public.kb_admin_get_founder_brief_v0(timestamptz)
  rename to kb_admin_get_founder_brief_unchecked_20261001;

revoke all on function public.kb_admin_get_founder_brief_unchecked_20261001(timestamptz)
  from public, anon, authenticated, service_role;

create function public.kb_admin_get_founder_brief_v0(
  p_as_of timestamptz default now()
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Founder brief requires platform administrator access'
      using errcode = '42501';
  end if;

  return public.kb_admin_get_founder_brief_unchecked_20261001(p_as_of);
end;
$function$;

revoke all on function public.kb_admin_get_founder_brief_v0(timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamptz)
  to authenticated, service_role;

comment on function public.kb_admin_get_founder_brief_v0(timestamptz) is
  'Platform-admin-only founder brief. Historical composition functions are private implementation details.';
