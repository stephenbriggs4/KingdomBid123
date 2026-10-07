-- Explicitly record the gate decision; never pretend a second source exists.
-- Exceptions permit a measured acquisition batch only and do not make claims
-- publishable or independently corroborated.

create table church_intel.evidence_independence_decisions (
  organization_id uuid primary key references church_intel.church_organizations(id) on delete cascade,
  decision text not null,
  allowed_scope text[] not null,
  rationale text not null,
  accepted_at timestamptz not null default now(),
  accepted_by uuid not null references auth.users(id) on delete restrict,
  review_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint ci_independence_decision_ck check (decision in ('accepted_for_controlled_acquisition','blocked')),
  constraint ci_independence_scope_ck check (cardinality(allowed_scope)>0 and allowed_scope <@ array['research','verification','internal_analytics']::text[]),
  constraint ci_independence_rationale_ck check (char_length(btrim(rationale))>=40),
  constraint ci_independence_review_ck check (review_due_at>accepted_at)
);

alter table church_intel.evidence_independence_decisions enable row level security;
alter table church_intel.evidence_independence_decisions force row level security;
revoke all on church_intel.evidence_independence_decisions from public,anon,authenticated,service_role;

create or replace function public.ci_get_health_summary()
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
    'single_source_accepted',(select count(*) from org_families f join church_intel.evidence_independence_decisions d on d.organization_id=f.id where f.family_count=1 and d.decision='accepted_for_controlled_acquisition'),
    'single_source_pending',(select count(*) from org_families f left join church_intel.evidence_independence_decisions d on d.organization_id=f.id where f.family_count=1 and d.organization_id is null),
    'zero_source_organizations',(select count(*) from org_families where family_count=0),
    'open_reviews',(select count(*) from church_intel.review_cases where status in ('open','in_progress')),
    'new_signals',(select count(*) from church_intel.operational_signals where status='new'),
    'last_source_retrieval',(select max(retrieved_at) from church_intel.source_records),
    'last_website_scan',(select max(scanned_at) from church_intel.website_scan_runs)
  ) end;
$function$;

create function public.ci_set_evidence_independence_decision(p_organization_id uuid,p_decision text,p_rationale text)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare actor uuid;
begin
  actor:=church_intel.platform_admin_actor();
  if p_decision not in ('accepted_for_controlled_acquisition','blocked') then raise exception 'invalid independence decision'; end if;
  if char_length(btrim(coalesce(p_rationale,'')))<40 then raise exception 'a specific rationale of at least 40 characters is required'; end if;
  insert into church_intel.evidence_independence_decisions(organization_id,decision,allowed_scope,rationale,accepted_by,review_due_at)
  values(p_organization_id,p_decision,array['research','verification','internal_analytics']::text[],btrim(p_rationale),actor,now()+interval '90 days')
  on conflict(organization_id) do update set decision=excluded.decision,allowed_scope=excluded.allowed_scope,rationale=excluded.rationale,accepted_at=now(),accepted_by=actor,review_due_at=excluded.review_due_at;
  return p_organization_id;
end;
$function$;

revoke all on function public.ci_set_evidence_independence_decision(uuid,text,text) from public,anon,service_role;
grant execute on function public.ci_set_evidence_independence_decision(uuid,text,text) to authenticated;

comment on table church_intel.evidence_independence_decisions is 'Per-organization human gate decisions for genuine single-source records; never counted as corroborating evidence.';
