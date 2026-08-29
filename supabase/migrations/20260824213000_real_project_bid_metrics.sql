begin;

do $migration$
begin
  if to_regprocedure('public.kb_admin_get_founder_brief_v0(timestamp with time zone)') is not null
     and to_regprocedure('public.kb_admin_get_founder_brief_provenance_20260824_v1(timestamp with time zone)') is null then
    alter function public.kb_admin_get_founder_brief_v0(timestamp with time zone)
      rename to kb_admin_get_founder_brief_provenance_20260824_v1;
  end if;
end
$migration$;

revoke all on function public.kb_admin_get_founder_brief_provenance_20260824_v1(timestamp with time zone)
  from public, anon, authenticated, service_role;

create or replace function public.kb_admin_get_founder_brief_v0(
  p_as_of timestamp with time zone default now()
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_brief jsonb;
  v_metrics jsonb;
  v_active_bids bigint;
begin
  v_brief := public.kb_admin_get_founder_brief_provenance_20260824_v1(p_as_of);

  select count(*)
  into v_active_bids
  from public.bids b
  join public.projects p on p.id = b.project_id
  where p.record_origin = 'real'
    and b.status = 'pending';

  v_metrics := coalesce(v_brief->'metrics', '{}'::jsonb)
    || jsonb_build_object(
      'active_bids', jsonb_build_object('value', v_active_bids, 'status', 'available')
    );

  return v_brief || jsonb_build_object('metrics', v_metrics);
end;
$function$;

revoke all on function public.kb_admin_get_founder_brief_v0(timestamp with time zone) from public, anon;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamp with time zone) to authenticated, service_role;

commit;
