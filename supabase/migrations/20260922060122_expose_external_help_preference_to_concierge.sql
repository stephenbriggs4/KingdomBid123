-- Smallest bridge from the private Church OS preference record to the
-- existing founder-only Concierge workspace. No placement state is changed.

create or replace function public.kb_admin_external_help_preferences()
returns table (
  external_help_case_id uuid,
  concierge_need_id uuid,
  preferred_match_id uuid,
  preferred_vendor_id uuid,
  preferred_vendor_name text,
  preferred_match_recorded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not (select public.kb_is_platform_admin()) then
    raise exception using
      errcode = '42501',
      message = 'Platform admin access required';
  end if;

  return query
  select
    c.id,
    c.concierge_need_id,
    c.preferred_match_id,
    m.vendor_id,
    v.vendor_name,
    c.preferred_match_recorded_at
  from private.external_help_cases c
  join concierge_ops.matches m
    on m.id = c.preferred_match_id
   and m.need_id = c.concierge_need_id
   and m.archived_at is null
  join concierge_ops.vendors v
    on v.id = m.vendor_id
   and v.archived_at is null
  where c.concierge_need_id is not null
    and c.preferred_match_id is not null
  order by c.preferred_match_recorded_at desc nulls last;
end;
$$;

revoke all on function public.kb_admin_external_help_preferences()
  from public, anon, authenticated, service_role;
grant execute on function public.kb_admin_external_help_preferences()
  to authenticated;

comment on function public.kb_admin_external_help_preferences() is
  'Admin-only read contract exposing the provider preference recorded by Church OS. It does not select a Concierge Match, set fees, or create an Engagement.';
