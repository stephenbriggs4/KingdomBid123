-- Founder-only, PII-free demand reconciliation across legacy signup,
-- canonical waitlist, Growth Engine, and active Concierge records.

create or replace function concierge_ops.demand_reconciliation_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with authorized as (
    select public.kb_is_platform_admin() as allowed
  ),
  church_rows as (
    select 'early_signups'::text source, id::text source_id,
      pg_catalog.lower(nullif(pg_catalog.btrim(email),'')) email_key,
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(nullif(pg_catalog.btrim(church_name),''),nullif(pg_catalog.btrim(name),''),'')),'[^a-z0-9]+','','g') name_key,
      null::text domain_key
    from public.early_signups, authorized where role='church' and authorized.allowed
    union all
    select 'waitlist',id::text,pg_catalog.lower(nullif(pg_catalog.btrim(email),'')),
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(nullif(pg_catalog.btrim(org_name),''),nullif(pg_catalog.btrim(name),''),nullif(pg_catalog.btrim(full_name),''),'')),'[^a-z0-9]+','','g'),null
    from public.waitlist, authorized where role='church' and authorized.allowed
    union all
    select 'growth_churches',id::text,
      pg_catalog.lower((pg_catalog.regexp_match(coalesce(contact_info,''),'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}','i'))[1]),
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(name,'')),'[^a-z0-9]+','','g'),
      pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.regexp_replace(coalesce(website,''),'^https?://(www\.)?','','i')),'/.*$','','g')
    from public.growth_churches, authorized where authorized.allowed
  ),
  church_keys as (
    select coalesce(email_key,nullif(domain_key,''),nullif(name_key,''),'row:'||source||':'||source_id) identity_key
    from church_rows
  ),
  vendor_rows as (
    select 'early_signups'::text source,id::text source_id,
      pg_catalog.lower(nullif(pg_catalog.btrim(email),'')) email_key,
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(nullif(pg_catalog.btrim(name),''),'')),'[^a-z0-9]+','','g') name_key,
      null::text domain_key
    from public.early_signups, authorized where role='vendor' and authorized.allowed
    union all
    select 'waitlist',id::text,pg_catalog.lower(nullif(pg_catalog.btrim(email),'')),
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(nullif(pg_catalog.btrim(org_name),''),nullif(pg_catalog.btrim(name),''),nullif(pg_catalog.btrim(full_name),''),'')),'[^a-z0-9]+','','g'),null
    from public.waitlist, authorized where role='vendor' and authorized.allowed
    union all
    select 'growth_vendors',id::text,pg_catalog.lower(nullif(pg_catalog.btrim(email),'')),
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(name,'')),'[^a-z0-9]+','','g'),
      pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.regexp_replace(coalesce(website,''),'^https?://(www\.)?','','i')),'/.*$','','g')
    from public.growth_vendors, authorized where authorized.allowed
  ),
  vendor_keys as (
    select coalesce(email_key,nullif(domain_key,''),nullif(name_key,''),'row:'||source||':'||source_id) identity_key
    from vendor_rows
  )
  select pg_catalog.jsonb_build_object(
    'church_raw_rows',(select count(*) from church_keys),
    'church_unique_entities',(select count(distinct identity_key) from church_keys),
    'vendor_raw_rows',(select count(*) from vendor_keys),
    'vendor_unique_entities',(select count(distinct identity_key) from vendor_keys),
    'growth_vendor_research_leads',(select count(*) from public.growth_vendors),
    'confirmed_pilot_churches',(select count(*) from concierge_ops.organizations where pilot_cohort and archived_at is null),
    'verified_pilot_groups',(select count(*) from public.groups where lower(coalesce(platform,''))='facebook' and join_status='member' and pilot_relevant),
    'method','conservative exact email, domain, then normalized organization name',
    'as_of',pg_catalog.clock_timestamp()
  )
  from authorized
  where authorized.allowed;
$$;

revoke all on function concierge_ops.demand_reconciliation_summary()
  from public, anon;
grant execute on function concierge_ops.demand_reconciliation_summary()
  to authenticated, service_role;
