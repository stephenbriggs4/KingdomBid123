-- Keep worker-only RPCs outside the ci_* admin RPC contract. The ci_* prefix is
-- reserved for interactive admin functions that call platform_admin_actor().

drop function if exists public.ci_list_signal_targets(integer);
drop function if exists public.ci_record_website_scan(uuid,text,text,text,integer,integer,text,text,text,jsonb);

create function public.church_signal_worker_targets(p_limit integer default 20)
returns jsonb language sql security definer set search_path = '' as $function$
  select case when coalesce(auth.jwt()->>'role','')<>'service_role' then null else coalesce(jsonb_agg(x order by x.next_check_at,x.canonical_name),'[]'::jsonb) end
  from (
    select o.id as organization_id,o.canonical_name,o.canonical_website,
      coalesce(m.next_check_at,'epoch'::timestamptz) next_check_at,m.last_content_hash
    from church_intel.church_organizations o
    left join church_intel.website_monitor_state m on m.organization_id=o.id
    where o.canonical_website is not null and o.operating_state<>'inactive'
      and coalesce(m.next_check_at,'epoch'::timestamptz)<=now()
    order by coalesce(m.next_check_at,'epoch'::timestamptz),o.canonical_name
    limit least(greatest(coalesce(p_limit,20),1),50)
  ) x;
$function$;

create function public.church_record_website_scan(
  p_organization_id uuid,p_canonical_url text,p_content_hash text,p_outcome text,p_pages_fetched integer,
  p_http_status integer,p_classifier_model text,p_classifier_run_id text,p_error_detail text,p_signals jsonb
) returns uuid language plpgsql security definer set search_path = '' as $function$
declare run_id uuid; item jsonb;
begin
  if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service role required'; end if;
  if p_outcome not in ('classified','unchanged','robots_blocked','fetch_failed','classifier_failed','no_relevant_content') then raise exception 'invalid scan outcome'; end if;
  insert into church_intel.website_scan_runs(organization_id,canonical_url,content_hash,outcome,pages_fetched,http_status,classifier_model,classifier_run_id,error_detail)
  values(p_organization_id,p_canonical_url,p_content_hash,p_outcome,least(greatest(coalesce(p_pages_fetched,0),0),12),p_http_status,p_classifier_model,p_classifier_run_id,left(p_error_detail,2000)) returning id into run_id;
  insert into church_intel.website_monitor_state(organization_id,canonical_url,last_content_hash,last_checked_at,last_changed_at,last_http_status,last_error,next_check_at,updated_at)
  values(p_organization_id,p_canonical_url,p_content_hash,now(),case when p_outcome in ('classified','no_relevant_content') then now() end,p_http_status,left(p_error_detail,2000),now()+interval '7 days',now())
  on conflict(organization_id) do update set canonical_url=excluded.canonical_url,last_content_hash=coalesce(excluded.last_content_hash,church_intel.website_monitor_state.last_content_hash),last_checked_at=excluded.last_checked_at,last_changed_at=coalesce(excluded.last_changed_at,church_intel.website_monitor_state.last_changed_at),last_http_status=excluded.last_http_status,last_error=excluded.last_error,next_check_at=excluded.next_check_at,updated_at=now();
  if jsonb_typeof(coalesce(p_signals,'[]'::jsonb))='array' then
    for item in select value from jsonb_array_elements(coalesce(p_signals,'[]'::jsonb)) loop
      insert into church_intel.operational_signals(organization_id,scan_run_id,signal_type,title,summary,evidence_quote,source_url,source_content_hash,confidence_score,detected_at)
      values(p_organization_id,run_id,item->>'signal_type',item->>'title',item->>'summary',item->>'evidence_quote',item->>'source_url',p_content_hash,(item->>'confidence_score')::numeric,coalesce((item->>'detected_at')::timestamptz,now()))
      on conflict(organization_id,signal_type,source_url,source_content_hash) do nothing;
    end loop;
  end if;
  return run_id;
end;
$function$;

revoke all on function public.church_signal_worker_targets(integer) from public,anon,authenticated;
revoke all on function public.church_record_website_scan(uuid,text,text,text,integer,integer,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.church_signal_worker_targets(integer) to service_role;
grant execute on function public.church_record_website_scan(uuid,text,text,text,integer,integer,text,text,text,jsonb) to service_role;

comment on function public.church_signal_worker_targets(integer) is 'Service-only weekly target list for canonical first-party church websites.';
