-- Complete the internal Church Intelligence workspace and add the deliberately
-- separate, human-reviewed website signal pipeline described in roadmap section 8.
-- Browser access remains RPC-only; all new admin RPCs call platform_admin_actor()
-- directly so they do not inherit the locked-owner assert_admin() trap.

create table church_intel.website_monitor_state (
  organization_id uuid primary key references church_intel.church_organizations(id) on delete cascade,
  canonical_url text not null,
  last_content_hash text,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  last_http_status integer,
  last_error text,
  next_check_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ci_monitor_hash_ck check (last_content_hash is null or last_content_hash ~ '^[0-9a-f]{64}$'),
  constraint ci_monitor_http_ck check (last_http_status is null or last_http_status between 100 and 599)
);

create table church_intel.website_scan_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references church_intel.church_organizations(id) on delete cascade,
  canonical_url text not null,
  content_hash text,
  outcome text not null,
  pages_fetched integer not null default 0,
  http_status integer,
  classifier_model text,
  classifier_run_id text,
  error_detail text,
  scanned_at timestamptz not null default now(),
  constraint ci_scan_hash_ck check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  constraint ci_scan_outcome_ck check (outcome in ('classified','unchanged','robots_blocked','fetch_failed','classifier_failed','no_relevant_content')),
  constraint ci_scan_pages_ck check (pages_fetched between 0 and 12),
  constraint ci_scan_http_ck check (http_status is null or http_status between 100 and 599)
);

create table church_intel.operational_signals (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references church_intel.church_organizations(id) on delete cascade,
  scan_run_id uuid not null references church_intel.website_scan_runs(id) on delete cascade,
  signal_type text not null,
  title text not null,
  summary text not null,
  evidence_quote text not null,
  source_url text not null,
  source_content_hash text not null,
  confidence_score numeric(4,3) not null,
  detected_at timestamptz not null,
  status text not null default 'new',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ci_signal_type_ck check (signal_type in ('job_opening','renovation','capital_campaign','new_campus','relocation','physical_project')),
  constraint ci_signal_title_ck check (char_length(btrim(title)) between 2 and 240),
  constraint ci_signal_summary_ck check (char_length(btrim(summary)) between 2 and 2000),
  constraint ci_signal_quote_ck check (char_length(btrim(evidence_quote)) between 2 and 1000),
  constraint ci_signal_hash_ck check (source_content_hash ~ '^[0-9a-f]{64}$'),
  constraint ci_signal_confidence_ck check (confidence_score between 0 and 1),
  constraint ci_signal_status_ck check (status in ('new','reviewed','dismissed','handed_to_growth')),
  constraint ci_signal_review_ck check (
    (status = 'new' and reviewed_at is null and reviewed_by is null) or
    (status <> 'new' and reviewed_at is not null and reviewed_by is not null and nullif(btrim(review_reason),'') is not null)
  )
);

create index ci_scan_org_time_idx on church_intel.website_scan_runs(organization_id,scanned_at desc);
create index ci_signal_queue_idx on church_intel.operational_signals(status,detected_at desc);
create index ci_signal_org_idx on church_intel.operational_signals(organization_id,detected_at desc);
create unique index ci_signal_dedupe_uq on church_intel.operational_signals(organization_id,signal_type,source_url,source_content_hash);

alter table church_intel.website_monitor_state enable row level security;
alter table church_intel.website_monitor_state force row level security;
alter table church_intel.website_scan_runs enable row level security;
alter table church_intel.website_scan_runs force row level security;
alter table church_intel.operational_signals enable row level security;
alter table church_intel.operational_signals force row level security;
revoke all on church_intel.website_monitor_state,church_intel.website_scan_runs,church_intel.operational_signals from public,anon,authenticated,service_role;

create function public.ci_list_organizations_overview_page(
  p_limit integer default 200,
  p_offset integer default 0
) returns jsonb
language sql stable security definer set search_path = '' as $function$
  with access_gate as (
    select church_intel.platform_admin_actor() as actor
  ), base as (
    select
      o.id,o.canonical_name,o.operating_state,o.canonical_website,o.updated_at,
      s.address_line_1,s.locality,s.region_code,s.postal_code,s.latitude,s.longitude,
      m.membership_result as dallas_membership,
      (select c.asserted_value #>> '{}'
       from church_intel.evidence_claims c
       where c.organization_id=o.id and c.attribute_key='denomination' and c.claim_status='promoted'
         and 'research'=any(c.allowed_purposes) and 'research'=any(c.current_use_ceiling)
       order by c.promoted_at desc nulls last,c.created_at desc limit 1) as denomination,
      (select (v.transformation_metadata->>'council_district')::integer
       from church_intel.geo_boundary_versions v
       where v.boundary_scope='district' and v.publication_status='published' and v.effective_to is null
         and s.longitude is not null and s.latitude is not null
         and extensions.st_contains(v.boundary,extensions.st_setsrid(extensions.st_makepoint(s.longitude::double precision,s.latitude::double precision),4326))
       order by (v.transformation_metadata->>'council_district')::integer limit 1) as council_district,
      exists(select 1 from church_intel.evidence_claims c where c.organization_id=o.id and c.claim_status='promoted') as has_promoted_claim,
      (select count(*) from church_intel.evidence_claims c where c.organization_id=o.id) as claim_count,
      (select count(*) from church_intel.review_cases r where r.subject_organization_id=o.id and r.status in ('open','in_progress')) as open_review_case_count,
      exists(select 1 from church_intel.church_system_links sl where sl.organization_id=o.id and sl.system_key='faithbid_profile' and sl.link_status='active') as linked_to_faithbid,
      (select sl.link_status from church_intel.church_system_links sl where sl.organization_id=o.id and sl.system_key='faithbid_profile' order by (sl.link_status='active') desc,sl.created_at desc limit 1) as link_status,
      (select count(distinct sr.independence_family_key)
       from church_intel.evidence_claims ec
       join church_intel.source_records er on er.id=ec.source_record_id
       join church_intel.source_registry sr on sr.id=er.source_id
       where ec.organization_id=o.id
          or ec.campus_id in (select cc.id from church_intel.church_campuses cc where cc.organization_id=o.id)
          or ec.site_id in (
            select csl2.site_id from church_intel.campus_site_links csl2
            join church_intel.church_campuses cc2 on cc2.id=csl2.campus_id
            where cc2.organization_id=o.id and csl2.is_current
          )) as evidence_family_count
    from church_intel.church_organizations o
    left join church_intel.church_campuses camp on camp.organization_id=o.id and camp.is_primary
    left join church_intel.campus_site_links l on l.campus_id=camp.id and l.site_role='primary' and l.is_current
    left join church_intel.church_sites s on s.id=l.site_id
    left join church_intel.site_geo_memberships m on m.site_id=s.id and m.is_current
  ), shaped as (
    select b.*,
      (b.address_line_1 is not null and b.denomination is not null and b.dallas_membership='included' and b.open_review_case_count=0) as is_ready,
      case
        when b.dallas_membership='excluded' then 'outside_dallas'
        when b.open_review_case_count>0 then 'needs_review'
        when b.dallas_membership='review' then 'boundary_review'
        when b.address_line_1 is not null and b.denomination is not null and b.dallas_membership='included' then 'verified'
        else 'candidate'
      end as intelligence_status
    from base b
  ), page as (
    select * from shaped order by canonical_name limit least(greatest(coalesce(p_limit,200),1),500) offset greatest(coalesce(p_offset,0),0)
  )
  select case when (select actor from access_gate) is null then null else jsonb_build_object(
    'rows',coalesce((select jsonb_agg(to_jsonb(page) order by canonical_name) from page),'[]'::jsonb),
    'total',(select count(*) from shaped),
    'refreshed_at',(select greatest(coalesce(max(updated_at),'epoch'::timestamptz),coalesce((select max(retrieved_at) from church_intel.source_records),'epoch'::timestamptz)) from base)
  ) end;
$function$;

create function public.ci_get_organization_profile(p_organization_id uuid,p_requested_purpose text default 'research')
returns jsonb language sql stable security definer set search_path = '' as $function$
  with gate as (
    select church_intel.platform_admin_actor() actor
  ), target as (
    select * from church_intel.church_organizations where id=p_organization_id
  ), subject_campuses as (
    select id from church_intel.church_campuses where organization_id=p_organization_id
  ), subject_sites as (
    select csl.site_id from church_intel.campus_site_links csl join subject_campuses c on c.id=csl.campus_id where csl.is_current
  ), site_docs as (
    select csl.campus_id,jsonb_agg(
      (to_jsonb(s)-'created_by'-'updated_by') || jsonb_build_object(
        'site_role',csl.site_role,
        'memberships',coalesce((
          select jsonb_agg(jsonb_build_object(
            'membership_result',gm.membership_result,'evaluation_method',gm.evaluation_method,
            'distance_to_boundary_m',gm.distance_to_boundary_m,'reason',gm.reason,'evaluated_at',gm.evaluated_at,
            'boundary_scope',bv.boundary_scope,'boundary_version',bv.version_label,
            'council_district',case when bv.boundary_scope='district' then (bv.transformation_metadata->>'council_district')::integer else null end
          ) order by gm.evaluated_at desc)
          from church_intel.site_geo_memberships gm join church_intel.geo_boundary_versions bv on bv.id=gm.boundary_version_id
          where gm.site_id=s.id and gm.is_current
        ),'[]'::jsonb)
      ) order by csl.site_role
    ) sites
    from church_intel.campus_site_links csl join church_intel.church_sites s on s.id=csl.site_id
    where csl.campus_id in (select id from subject_campuses) and csl.is_current group by csl.campus_id
  ), campus_docs as (
    select coalesce(jsonb_agg((to_jsonb(c)-'created_by'-'updated_by') || jsonb_build_object('sites',coalesce(sd.sites,'[]'::jsonb)) order by c.is_primary desc,c.campus_name),'[]'::jsonb) doc
    from church_intel.church_campuses c left join site_docs sd on sd.campus_id=c.id where c.organization_id=p_organization_id
  ), claim_docs as (
    select coalesce(jsonb_agg((to_jsonb(ec)-'created_by'-'promoted_by') || jsonb_build_object(
      'source',jsonb_build_object('display_name',sr.display_name,'source_key',sr.source_key,'authority_class',sr.authority_class,'independence_family_key',sr.independence_family_key,'source_url',rec.source_url,'retrieved_at',rec.retrieved_at)
    ) order by ec.observed_at desc),'[]'::jsonb) doc
    from church_intel.evidence_claims ec join church_intel.source_records rec on rec.id=ec.source_record_id join church_intel.source_registry sr on sr.id=rec.source_id
    where (ec.organization_id=p_organization_id or ec.campus_id in (select id from subject_campuses) or ec.site_id in (select site_id from subject_sites))
      and p_requested_purpose=any(ec.allowed_purposes) and p_requested_purpose=any(ec.current_use_ceiling)
  ), review_docs as (
    select coalesce(jsonb_agg((to_jsonb(r)-'owner_user_id'-'created_by'-'updated_by'-'resolved_by') order by r.created_at desc),'[]'::jsonb) doc
    from church_intel.review_cases r where r.subject_organization_id=p_organization_id or r.subject_campus_id in (select id from subject_campuses) or r.subject_site_id in (select site_id from subject_sites)
  ), evidence_summary as (
    select jsonb_build_object('independent_source_families',count(distinct sr.independence_family_key),'last_observed_at',max(ec.observed_at)) doc
    from church_intel.evidence_claims ec join church_intel.source_records rec on rec.id=ec.source_record_id join church_intel.source_registry sr on sr.id=rec.source_id
    where ec.organization_id=p_organization_id or ec.campus_id in (select id from subject_campuses) or ec.site_id in (select site_id from subject_sites)
  )
  select case when (select actor from gate) is null then null else jsonb_build_object(
    'organization',to_jsonb(t)-'created_by'-'updated_by','campuses',c.doc,'claims',cl.doc,'reviews',r.doc,'evidence_summary',e.doc
  ) end
  from target t cross join campus_docs c cross join claim_docs cl cross join review_docs r cross join evidence_summary e
  where p_requested_purpose in ('research','verification','internal_analytics','outreach','export','redistribution','publication');
$function$;

create function public.ci_get_health_summary()
returns jsonb language sql stable security definer set search_path = '' as $function$
  with gate as (select church_intel.platform_admin_actor() actor), org_families as (
    select o.id,count(distinct sr.independence_family_key) family_count
    from church_intel.church_organizations o
    left join church_intel.church_campuses c on c.organization_id=o.id
    left join church_intel.campus_site_links csl on csl.campus_id=c.id and csl.is_current
    left join church_intel.evidence_claims ec on ec.organization_id=o.id or ec.campus_id=c.id or ec.site_id=csl.site_id
    left join church_intel.source_records rec on rec.id=ec.source_record_id
    left join church_intel.source_registry sr on sr.id=rec.source_id
    group by o.id
  )
  select case when (select actor from gate) is null then null else jsonb_build_object(
    'as_of',now(),
    'organizations',(select count(*) from church_intel.church_organizations),
    'canonical_websites',(select count(*) from church_intel.church_organizations where canonical_website is not null),
    'two_source_organizations',(select count(*) from org_families where family_count>=2),
    'single_source_organizations',(select count(*) from org_families where family_count=1),
    'zero_source_organizations',(select count(*) from org_families where family_count=0),
    'open_reviews',(select count(*) from church_intel.review_cases where status in ('open','in_progress')),
    'new_signals',(select count(*) from church_intel.operational_signals where status='new'),
    'last_source_retrieval',(select max(retrieved_at) from church_intel.source_records),
    'last_website_scan',(select max(scanned_at) from church_intel.website_scan_runs)
  ) end;
$function$;

create function public.ci_list_operational_signals(p_status text default null,p_limit integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $function$
  select case when church_intel.platform_admin_actor() is null then null else coalesce(jsonb_agg(x order by x.detected_at desc),'[]'::jsonb) end
  from (
    select s.id,s.organization_id,o.canonical_name,s.signal_type,s.title,s.summary,s.evidence_quote,s.source_url,
      s.confidence_score,s.detected_at,s.status,s.reviewed_at,s.review_reason,s.created_at
    from church_intel.operational_signals s join church_intel.church_organizations o on o.id=s.organization_id
    where p_status is null or s.status=p_status
    order by s.detected_at desc limit least(greatest(coalesce(p_limit,100),1),500)
  ) x;
$function$;

create function public.ci_review_operational_signal(p_signal_id uuid,p_status text,p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare actor uuid;
begin
  actor:=church_intel.platform_admin_actor();
  if actor is null then raise exception 'platform admin required'; end if;
  if p_status not in ('reviewed','dismissed','handed_to_growth') then raise exception 'invalid signal status'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'review reason required'; end if;
  update church_intel.operational_signals set status=p_status,reviewed_at=now(),reviewed_by=actor,review_reason=btrim(p_reason),updated_at=now() where id=p_signal_id;
  if not found then raise exception 'signal not found'; end if;
  return p_signal_id;
end;
$function$;

create function public.ci_list_signal_targets(p_limit integer default 20)
returns jsonb language sql security definer set search_path = '' as $function$
  select case when coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role' then null else coalesce(jsonb_agg(x order by x.next_check_at,o.canonical_name),'[]'::jsonb) end
  from church_intel.church_organizations o
  left join church_intel.website_monitor_state m on m.organization_id=o.id
  cross join lateral (select o.id as organization_id,o.canonical_name,o.canonical_website,coalesce(m.next_check_at,'epoch'::timestamptz) next_check_at,m.last_content_hash) x
  where o.canonical_website is not null and o.operating_state<>'inactive' and coalesce(m.next_check_at,'epoch'::timestamptz)<=now()
  limit least(greatest(coalesce(p_limit,20),1),50);
$function$;

create function public.ci_record_website_scan(
  p_organization_id uuid,p_canonical_url text,p_content_hash text,p_outcome text,p_pages_fetched integer,
  p_http_status integer,p_classifier_model text,p_classifier_run_id text,p_error_detail text,p_signals jsonb
) returns uuid language plpgsql security definer set search_path = '' as $function$
declare run_id uuid; item jsonb;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role' then raise exception 'service role required'; end if;
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

revoke all on function public.ci_list_organizations_overview_page(integer,integer) from public,anon,service_role;
revoke all on function public.ci_get_organization_profile(uuid,text) from public,anon,service_role;
revoke all on function public.ci_get_health_summary() from public,anon,service_role;
revoke all on function public.ci_list_operational_signals(text,integer) from public,anon,service_role;
revoke all on function public.ci_review_operational_signal(uuid,text,text) from public,anon,service_role;
grant execute on function public.ci_list_organizations_overview_page(integer,integer) to authenticated;
grant execute on function public.ci_get_organization_profile(uuid,text) to authenticated;
grant execute on function public.ci_get_health_summary() to authenticated;
grant execute on function public.ci_list_operational_signals(text,integer) to authenticated;
grant execute on function public.ci_review_operational_signal(uuid,text,text) to authenticated;

revoke all on function public.ci_list_signal_targets(integer) from public,anon,authenticated;
revoke all on function public.ci_record_website_scan(uuid,text,text,text,integer,integer,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.ci_list_signal_targets(integer) to service_role;
grant execute on function public.ci_record_website_scan(uuid,text,text,text,integer,integer,text,text,text,jsonb) to service_role;

comment on table church_intel.operational_signals is 'Website-derived operational hints kept separate from canonical church evidence and requiring human review before action.';
comment on function public.ci_list_organizations_overview_page(integer,integer) is 'Admin-gated paginated directory read with evidence independence, readiness, status, district, and freshness.';
comment on function public.ci_get_organization_profile(uuid,text) is 'Admin-gated evidence-rich church profile with sources, sites, boundary membership, and review history.';
comment on function public.ci_list_signal_targets(integer) is 'Service-only weekly target list for canonical first-party church websites.';
