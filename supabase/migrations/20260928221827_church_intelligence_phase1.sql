-- FaithBid Church Intelligence — Dallas V1 foundation.
-- Private domain; 11 tables; browser access is RPC-only.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'church_intel_api_owner') then
    create role church_intel_api_owner nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
end $$;

create schema if not exists church_intel authorization postgres;
revoke all on schema church_intel from public, anon, authenticated, service_role;
grant usage on schema church_intel to church_intel_api_owner;
grant church_intel_api_owner to postgres;
grant create on schema church_intel to church_intel_api_owner;

create table church_intel.church_organizations (
 id uuid primary key default extensions.gen_random_uuid(), canonical_name text not null,
 operating_state text not null default 'unknown', canonical_website text, institutional_email text, institutional_phone text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 constraint ci_org_name_ck check (canonical_name=btrim(canonical_name) and char_length(canonical_name) between 2 and 300),
 constraint ci_org_state_ck check (operating_state in ('active','inactive','unknown','review'))
);
create table church_intel.church_campuses (
 id uuid primary key default extensions.gen_random_uuid(), organization_id uuid not null references church_intel.church_organizations(id) on delete restrict,
 campus_name text not null, operating_state text not null default 'unknown', is_primary boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 constraint ci_campus_name_ck check (campus_name=btrim(campus_name) and char_length(campus_name) between 2 and 300),
 constraint ci_campus_state_ck check (operating_state in ('active','inactive','unknown','review'))
);
create table church_intel.church_sites (
 id uuid primary key default extensions.gen_random_uuid(), address_line_1 text not null, address_line_2 text,
 locality text not null, region_code text not null, postal_code text, country_code text not null default 'US', normalized_address text not null,
 latitude numeric(9,6), longitude numeric(9,6), geocode_method text, geocode_precision text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 constraint ci_site_text_ck check (btrim(address_line_1)<>'' and btrim(locality)<>'' and btrim(region_code)<>'' and btrim(normalized_address)<>''),
 constraint ci_site_coords_ck check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180)),
 constraint ci_site_geocode_ck check ((latitude is null and geocode_method is null and geocode_precision is null) or (latitude is not null and geocode_method is not null and geocode_precision in ('rooftop','parcel','interpolated','street','postal','city','unknown')))
);
create table church_intel.campus_site_links (
 id uuid primary key default extensions.gen_random_uuid(), campus_id uuid not null references church_intel.church_campuses(id) on delete restrict,
 site_id uuid not null references church_intel.church_sites(id) on delete restrict, site_role text not null,
 valid_from date, valid_to date, is_current boolean not null default true, supporting_evidence_claim_id uuid,
 created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null,
 constraint ci_csl_role_ck check (site_role in ('primary','secondary','temporary','historic')),
 constraint ci_csl_dates_ck check (valid_to is null or valid_from is null or valid_to>=valid_from)
);
create table church_intel.source_registry (
 id uuid primary key default extensions.gen_random_uuid(), source_key text not null unique, display_name text not null,
 independence_family_key text not null, upstream_source_id uuid references church_intel.source_registry(id) on delete restrict,
 authority_class text not null, access_method text not null, terms_url text, terms_checked_at timestamptz not null,
 license_name text, default_allowed_purposes text[] not null, automation_status text not null, retention_rule text not null,
 policy_version integer not null default 1, policy_effective_at timestamptz not null, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null,
 constraint ci_source_key_ck check (source_key=lower(btrim(source_key)) and source_key~'^[a-z0-9_]+$'),
 constraint ci_source_family_ck check (independence_family_key=lower(btrim(independence_family_key)) and independence_family_key~'^[a-z0-9_]+$'),
 constraint ci_source_upstream_ck check (upstream_source_id is null or upstream_source_id<>id),
 constraint ci_source_authority_ck check (authority_class in ('official','open_dataset','first_party','directory','commercial','other')),
 constraint ci_source_access_ck check (access_method in ('api','bulk_download','public_web','manual','written_permission','other')),
 constraint ci_source_purpose_ck check (cardinality(default_allowed_purposes)>0 and default_allowed_purposes <@ array['research','verification','internal_analytics','outreach','export','redistribution','publication']::text[]),
 constraint ci_source_auto_ck check (automation_status in ('approved','manual_only','prohibited','unknown','paused')),
 constraint ci_source_policy_ck check (policy_version>0 and btrim(retention_rule)<>'')
);
create table church_intel.source_records (
 id uuid primary key default extensions.gen_random_uuid(), source_id uuid not null references church_intel.source_registry(id) on delete restrict,
 source_external_key text, source_url text, source_release text, source_schema_version text, observed_at timestamptz, retrieved_at timestamptz not null,
 content_hash text not null, extraction_hash text not null, parser_version text not null, retention_mode text not null,
 retained_payload jsonb, retained_excerpt text, rebuild_manifest jsonb, retention_revision integer not null default 0,
 retention_reduced_at timestamptz, retention_reduced_by uuid references auth.users(id) on delete set null, retention_reduction_reason text,
 source_license_snapshot jsonb not null default '{}'::jsonb, source_metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null,
 constraint ci_record_locator_ck check (source_external_key is not null or source_url is not null),
 constraint ci_record_hash_ck check (content_hash~'^[0-9a-f]{64}$' and extraction_hash~'^[0-9a-f]{64}$'),
 constraint ci_record_parser_ck check (btrim(parser_version)<>''),
 constraint ci_record_mode_ck check (retention_mode in ('payload','excerpt','manifest_only','metadata_only')),
 constraint ci_record_material_ck check (
   (retention_mode='payload' and retained_payload is not null and retained_excerpt is null) or
   (retention_mode='excerpt' and retained_payload is null and retained_excerpt is not null) or
   (retention_mode='manifest_only' and retained_payload is null and retained_excerpt is null and rebuild_manifest is not null) or
   (retention_mode='metadata_only' and retained_payload is null and retained_excerpt is null and rebuild_manifest is null)),
 constraint ci_record_audit_ck check ((retention_revision=0 and retention_reduced_at is null and retention_reduced_by is null and retention_reduction_reason is null) or (retention_revision>0 and retention_reduced_at is not null and nullif(btrim(retention_reduction_reason),'') is not null))
);
create table church_intel.evidence_claims (
 id uuid primary key default extensions.gen_random_uuid(), source_record_id uuid not null references church_intel.source_records(id) on delete restrict,
 organization_id uuid references church_intel.church_organizations(id) on delete restrict,
 campus_id uuid references church_intel.church_campuses(id) on delete restrict, site_id uuid references church_intel.church_sites(id) on delete restrict,
 attribute_key text not null, asserted_value jsonb not null, normalized_value jsonb, allowed_purposes text[] not null, current_use_ceiling text[] not null,
 claim_status text not null default 'observed', confidence_score numeric(4,3), confidence_basis jsonb not null default '{}'::jsonb,
 observed_at timestamptz not null, valid_from timestamptz, valid_to timestamptz, fresh_until timestamptz, negative_result_code text,
 promoted_at timestamptz, promoted_by uuid references auth.users(id) on delete set null,
 superseded_by_claim_id uuid references church_intel.evidence_claims(id) on delete restrict, review_case_id uuid,
 created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null,
 constraint ci_claim_subject_ck check (num_nonnulls(organization_id,campus_id,site_id)=1),
 constraint ci_claim_key_ck check (attribute_key=lower(btrim(attribute_key)) and attribute_key~'^[a-z0-9_.]+$'),
 constraint ci_claim_purpose_ck check (cardinality(allowed_purposes)>0 and allowed_purposes <@ array['research','verification','internal_analytics','outreach','export','redistribution','publication']::text[]),
 constraint ci_claim_ceiling_ck check (current_use_ceiling <@ allowed_purposes),
 constraint ci_claim_status_ck check (claim_status in ('observed','promoted','superseded','rejected','withdrawn')),
 constraint ci_claim_conf_ck check (confidence_score is null or confidence_score between 0 and 1),
 constraint ci_claim_dates_ck check (valid_to is null or valid_from is null or valid_to>=valid_from),
 constraint ci_claim_promoted_ck check (claim_status<>'promoted' or promoted_at is not null),
 constraint ci_claim_superseded_ck check ((claim_status='superseded' and superseded_by_claim_id is not null) or (claim_status<>'superseded' and superseded_by_claim_id is null))
);
alter table church_intel.campus_site_links add constraint ci_csl_evidence_fk foreign key(supporting_evidence_claim_id) references church_intel.evidence_claims(id) on delete restrict;

create table church_intel.geo_boundary_versions (
 id uuid primary key default extensions.gen_random_uuid(), geo_place_id uuid references public.geo_places(id) on delete restrict,
 geo_market_id uuid references public.geo_markets(id) on delete restrict, boundary_scope text not null,
 source_record_id uuid not null unique references church_intel.source_records(id) on delete restrict,
 version_label text not null, source_srid integer not null, normalized_srid integer not null default 4326,
 normalization_procedure_version text not null, transformation_metadata jsonb not null,
 boundary extensions.geometry(MultiPolygon,4326) not null, geometry_hash text not null,
 effective_from timestamptz, effective_to timestamptz, publication_status text not null default 'draft',
 published_at timestamptz, published_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null,
 constraint ci_boundary_owner_ck check (num_nonnulls(geo_place_id,geo_market_id)=1),
 constraint ci_boundary_scope_ck check (boundary_scope in ('city','county','metro')),
 constraint ci_boundary_owner_scope_ck check ((boundary_scope in ('city','county') and geo_place_id is not null and geo_market_id is null) or (boundary_scope='metro' and geo_market_id is not null and geo_place_id is null)),
 constraint ci_boundary_srid_ck check (source_srid>0 and normalized_srid=4326 and extensions.st_srid(boundary)=4326),
 constraint ci_boundary_hash_ck check (geometry_hash~'^[0-9a-f]{64}$'),
 constraint ci_boundary_proc_ck check (btrim(normalization_procedure_version)<>'' and jsonb_typeof(transformation_metadata)='object'),
 constraint ci_boundary_geom_ck check (not extensions.st_isempty(boundary) and extensions.st_isvalid(boundary)),
 constraint ci_boundary_status_ck check (publication_status in ('draft','published','superseded','rejected')),
 constraint ci_boundary_dates_ck check (effective_to is null or effective_from is null or effective_to>=effective_from),
 constraint ci_boundary_published_ck check (publication_status<>'published' or published_at is not null)
);
create table church_intel.review_cases (
 id uuid primary key default extensions.gen_random_uuid(), case_type text not null, severity text not null default 'normal', status text not null default 'open',
 subject_organization_id uuid references church_intel.church_organizations(id) on delete restrict,
 subject_campus_id uuid references church_intel.church_campuses(id) on delete restrict, subject_site_id uuid references church_intel.church_sites(id) on delete restrict,
 owner_user_id uuid references auth.users(id) on delete set null, due_at timestamptz, case_payload jsonb not null default '{}'::jsonb,
 resolution jsonb, resolved_at timestamptz, resolved_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 constraint ci_review_type_ck check (case_type in ('duplicate','boundary','evidence_conflict','correction','merge','split','closure','ai_staged_claim','source_policy')),
 constraint ci_review_severity_ck check (severity in ('low','normal','high','critical')),
 constraint ci_review_status_ck check (status in ('open','in_progress','resolved','dismissed')),
 constraint ci_review_subject_ck check (num_nonnulls(subject_organization_id,subject_campus_id,subject_site_id)<=1),
 constraint ci_review_resolution_ck check ((status in ('resolved','dismissed') and resolution is not null and resolved_at is not null) or (status in ('open','in_progress') and resolution is null and resolved_at is null and resolved_by is null))
);
alter table church_intel.evidence_claims add constraint ci_claim_review_fk foreign key(review_case_id) references church_intel.review_cases(id) on delete restrict;

create table church_intel.site_geo_memberships (
 id uuid primary key default extensions.gen_random_uuid(), site_id uuid not null references church_intel.church_sites(id) on delete restrict,
 boundary_version_id uuid not null references church_intel.geo_boundary_versions(id) on delete restrict,
 membership_result text not null, evaluation_method text not null, evaluation_algorithm_version text not null,
 coordinate_snapshot extensions.geometry(Point,4326) not null, geocode_precision_snapshot text not null, geocode_method_snapshot text not null,
 distance_to_boundary_m numeric(12,3) not null, reason text not null, review_case_id uuid references church_intel.review_cases(id) on delete restrict,
 evaluated_at timestamptz not null, evaluated_by uuid references auth.users(id) on delete set null,
 is_current boolean not null default true, superseded_at timestamptz, superseded_by_membership_id uuid, supersession_reason text,
 created_at timestamptz not null default now(),
 constraint ci_membership_result_ck check (membership_result in ('included','excluded','review')),
 constraint ci_membership_method_ck check (evaluation_method in ('point_in_polygon','manual_override')),
 constraint ci_membership_algo_ck check (btrim(evaluation_algorithm_version)<>''),
 constraint ci_membership_point_ck check (extensions.st_srid(coordinate_snapshot)=4326),
 constraint ci_membership_precision_ck check (geocode_precision_snapshot in ('rooftop','parcel','interpolated','street','postal','city','unknown')),
 constraint ci_membership_distance_ck check (distance_to_boundary_m>=0),
 constraint ci_membership_review_ck check ((membership_result='review' and review_case_id is not null) or membership_result<>'review'),
 constraint ci_membership_history_ck check ((is_current and superseded_at is null and superseded_by_membership_id is null and supersession_reason is null) or (not is_current and superseded_at is not null and superseded_by_membership_id is not null and nullif(btrim(supersession_reason),'') is not null))
);
alter table church_intel.site_geo_memberships add constraint ci_membership_superseded_fk foreign key(superseded_by_membership_id) references church_intel.site_geo_memberships(id) on delete restrict deferrable initially deferred;

create table church_intel.church_system_links (
 id uuid primary key default extensions.gen_random_uuid(), organization_id uuid not null references church_intel.church_organizations(id) on delete restrict,
 system_key text not null, faithbid_profile_id uuid references public.profiles(id) on delete restrict,
 growth_church_id uuid references public.growth_churches(id) on delete restrict,
 concierge_organization_id uuid references concierge_ops.organizations(id) on delete restrict,
 gpi_organization_id uuid references public.gpi_organizations(id) on delete restrict,
 link_status text not null default 'proposed', evidence_claim_id uuid references church_intel.evidence_claims(id) on delete restrict,
 review_case_id uuid references church_intel.review_cases(id) on delete restrict, valid_from timestamptz, valid_to timestamptz,
 superseded_by_link_id uuid references church_intel.church_system_links(id) on delete restrict deferrable initially deferred, resolution_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 constraint ci_link_system_ck check (system_key in ('faithbid_profile','growth_church','concierge_organization','gpi_organization')),
 constraint ci_link_target_ck check (num_nonnulls(faithbid_profile_id,growth_church_id,concierge_organization_id,gpi_organization_id)=1),
 constraint ci_link_match_ck check ((system_key='faithbid_profile' and faithbid_profile_id is not null) or (system_key='growth_church' and growth_church_id is not null) or (system_key='concierge_organization' and concierge_organization_id is not null) or (system_key='gpi_organization' and gpi_organization_id is not null)),
 constraint ci_link_status_ck check (link_status in ('proposed','active','rejected','superseded')),
 constraint ci_link_basis_ck check (link_status<>'active' or evidence_claim_id is not null or review_case_id is not null),
 constraint ci_link_history_ck check ((link_status='superseded' and valid_to is not null and superseded_by_link_id is not null and nullif(btrim(resolution_reason),'') is not null) or link_status<>'superseded')
);

-- Relationship, current-state, and spatial indexes.
create index ci_campus_org_idx on church_intel.church_campuses(organization_id);
create unique index ci_campus_primary_uq on church_intel.church_campuses(organization_id) where is_primary and operating_state<>'inactive';
create index ci_site_addr_idx on church_intel.church_sites(normalized_address);
create index ci_csl_campus_idx on church_intel.campus_site_links(campus_id); create index ci_csl_site_idx on church_intel.campus_site_links(site_id);
create unique index ci_csl_current_uq on church_intel.campus_site_links(campus_id,site_id,site_role) where is_current;
create index ci_source_upstream_idx on church_intel.source_registry(upstream_source_id) where upstream_source_id is not null;
create index ci_source_family_idx on church_intel.source_registry(independence_family_key);
create index ci_record_source_idx on church_intel.source_records(source_id,retrieved_at desc);
create unique index ci_record_dedupe_uq on church_intel.source_records(source_id,coalesce(source_external_key,''),content_hash,extraction_hash);
create index ci_claim_source_idx on church_intel.evidence_claims(source_record_id);
create index ci_claim_org_idx on church_intel.evidence_claims(organization_id) where organization_id is not null;
create index ci_claim_campus_idx on church_intel.evidence_claims(campus_id) where campus_id is not null;
create index ci_claim_site_idx on church_intel.evidence_claims(site_id) where site_id is not null;
create unique index ci_claim_promoted_org_uq on church_intel.evidence_claims(organization_id,attribute_key) where claim_status='promoted' and organization_id is not null;
create unique index ci_claim_promoted_campus_uq on church_intel.evidence_claims(campus_id,attribute_key) where claim_status='promoted' and campus_id is not null;
create unique index ci_claim_promoted_site_uq on church_intel.evidence_claims(site_id,attribute_key) where claim_status='promoted' and site_id is not null;
create index ci_boundary_place_idx on church_intel.geo_boundary_versions(geo_place_id) where geo_place_id is not null;
create index ci_boundary_market_idx on church_intel.geo_boundary_versions(geo_market_id) where geo_market_id is not null;
create index ci_boundary_gist_idx on church_intel.geo_boundary_versions using gist(boundary);
create unique index ci_boundary_published_place_uq on church_intel.geo_boundary_versions(geo_place_id,boundary_scope) where publication_status='published' and effective_to is null and geo_place_id is not null;
create unique index ci_boundary_published_market_uq on church_intel.geo_boundary_versions(geo_market_id,boundary_scope) where publication_status='published' and effective_to is null and geo_market_id is not null;
create index ci_review_queue_idx on church_intel.review_cases(status,severity,created_at) where status in ('open','in_progress');
create index ci_review_owner_idx on church_intel.review_cases(owner_user_id,status,due_at) where owner_user_id is not null and status in ('open','in_progress');
create index ci_membership_boundary_idx on church_intel.site_geo_memberships(boundary_version_id,membership_result);
create index ci_membership_point_gist_idx on church_intel.site_geo_memberships using gist(coordinate_snapshot);
create unique index ci_membership_current_uq on church_intel.site_geo_memberships(site_id,boundary_version_id) where is_current;
create index ci_membership_superseded_idx on church_intel.site_geo_memberships(superseded_by_membership_id) where superseded_by_membership_id is not null;
create index ci_link_org_idx on church_intel.church_system_links(organization_id,system_key,link_status);
create unique index ci_link_profile_external_uq on church_intel.church_system_links(faithbid_profile_id) where link_status='active' and faithbid_profile_id is not null;
create unique index ci_link_growth_external_uq on church_intel.church_system_links(growth_church_id) where link_status='active' and growth_church_id is not null;
create unique index ci_link_concierge_external_uq on church_intel.church_system_links(concierge_organization_id) where link_status='active' and concierge_organization_id is not null;
create unique index ci_link_gpi_external_uq on church_intel.church_system_links(gpi_organization_id) where link_status='active' and gpi_organization_id is not null;
create unique index ci_link_singleton_uq on church_intel.church_system_links(organization_id,system_key) where link_status='active' and system_key in ('growth_church','concierge_organization','gpi_organization');

create index ci_csl_evidence_idx on church_intel.campus_site_links(supporting_evidence_claim_id) where supporting_evidence_claim_id is not null;
create index ci_claim_review_idx on church_intel.evidence_claims(review_case_id) where review_case_id is not null;
create index ci_claim_superseded_idx on church_intel.evidence_claims(superseded_by_claim_id) where superseded_by_claim_id is not null;
create index ci_review_org_idx on church_intel.review_cases(subject_organization_id) where subject_organization_id is not null;
create index ci_review_campus_idx on church_intel.review_cases(subject_campus_id) where subject_campus_id is not null;
create index ci_review_site_idx on church_intel.review_cases(subject_site_id) where subject_site_id is not null;
create index ci_membership_review_idx on church_intel.site_geo_memberships(review_case_id) where review_case_id is not null;
create index ci_link_evidence_idx on church_intel.church_system_links(evidence_claim_id) where evidence_claim_id is not null;
create index ci_link_review_idx on church_intel.church_system_links(review_case_id) where review_case_id is not null;
create index ci_link_superseded_idx on church_intel.church_system_links(superseded_by_link_id) where superseded_by_link_id is not null;

-- Actor-reference indexes keep Auth user deletion and audit lookups bounded.
create index ci_org_created_by_idx on church_intel.church_organizations(created_by) where created_by is not null;
create index ci_org_updated_by_idx on church_intel.church_organizations(updated_by) where updated_by is not null;
create index ci_campus_created_by_idx on church_intel.church_campuses(created_by) where created_by is not null;
create index ci_campus_updated_by_idx on church_intel.church_campuses(updated_by) where updated_by is not null;
create index ci_site_created_by_idx on church_intel.church_sites(created_by) where created_by is not null;
create index ci_site_updated_by_idx on church_intel.church_sites(updated_by) where updated_by is not null;
create index ci_csl_created_by_idx on church_intel.campus_site_links(created_by) where created_by is not null;
create index ci_source_updated_by_idx on church_intel.source_registry(updated_by) where updated_by is not null;
create index ci_record_created_by_idx on church_intel.source_records(created_by) where created_by is not null;
create index ci_record_retention_by_idx on church_intel.source_records(retention_reduced_by) where retention_reduced_by is not null;
create index ci_claim_created_by_idx on church_intel.evidence_claims(created_by) where created_by is not null;
create index ci_claim_promoted_by_idx on church_intel.evidence_claims(promoted_by) where promoted_by is not null;
create index ci_boundary_created_by_idx on church_intel.geo_boundary_versions(created_by) where created_by is not null;
create index ci_boundary_published_by_idx on church_intel.geo_boundary_versions(published_by) where published_by is not null;
create index ci_review_created_by_idx on church_intel.review_cases(created_by) where created_by is not null;
create index ci_review_updated_by_idx on church_intel.review_cases(updated_by) where updated_by is not null;
create index ci_review_resolved_by_idx on church_intel.review_cases(resolved_by) where resolved_by is not null;
create index ci_membership_evaluated_by_idx on church_intel.site_geo_memberships(evaluated_by) where evaluated_by is not null;
create index ci_link_created_by_idx on church_intel.church_system_links(created_by) where created_by is not null;
create index ci_link_updated_by_idx on church_intel.church_system_links(updated_by) where updated_by is not null;

-- Immutable provenance with a single monotonic retention-reduction exception.
create function church_intel.guard_source_record() returns trigger language plpgsql set search_path='' as $$
declare old_rank int; new_rank int;
begin
 if tg_op='DELETE' then raise exception using errcode='55000',message='source_records cannot be deleted'; end if;
 if (to_jsonb(new)-array['created_by','retention_reduced_by']::text[]) is not distinct from (to_jsonb(old)-array['created_by','retention_reduced_by']::text[])
    and (new.created_by is not distinct from old.created_by or (old.created_by is not null and new.created_by is null))
    and (new.retention_reduced_by is not distinct from old.retention_reduced_by or (old.retention_reduced_by is not null and new.retention_reduced_by is null))
    and (new.created_by is distinct from old.created_by or new.retention_reduced_by is distinct from old.retention_reduced_by) then return new; end if;
 if (to_jsonb(new)-array['retention_mode','retained_payload','retained_excerpt','rebuild_manifest','retention_revision','retention_reduced_at','retention_reduced_by','retention_reduction_reason']::text[])
    is distinct from
    (to_jsonb(old)-array['retention_mode','retained_payload','retained_excerpt','rebuild_manifest','retention_revision','retention_reduced_at','retention_reduced_by','retention_reduction_reason']::text[])
 then raise exception using errcode='55000',message='source observation provenance is immutable'; end if;
 old_rank:=case old.retention_mode when 'payload' then 4 when 'excerpt' then 3 when 'manifest_only' then 2 else 1 end;
 new_rank:=case new.retention_mode when 'payload' then 4 when 'excerpt' then 3 when 'manifest_only' then 2 else 1 end;
 if new_rank>=old_rank then raise exception using errcode='55000',message='retention may only decrease'; end if;
 if new.retention_revision<>old.retention_revision+1 or new.retention_reduced_at is null or new.retention_reduced_by is null or nullif(btrim(new.retention_reduction_reason),'') is null
 then raise exception using errcode='55000',message='retention reduction requires actor, time, reason, and next revision'; end if;
 return new;
end $$;
create trigger ci_source_record_guard before update or delete on church_intel.source_records for each row execute function church_intel.guard_source_record();

create function church_intel.guard_claim_rights() returns trigger language plpgsql set search_path='' as $$
begin
 if old.allowed_purposes is distinct from new.allowed_purposes then raise exception using errcode='55000',message='allowed_purposes is immutable'; end if;
 if not (new.current_use_ceiling <@ old.current_use_ceiling) then raise exception using errcode='55000',message='current_use_ceiling may only narrow'; end if;
 return new;
end $$;
create trigger ci_claim_rights_guard before update of allowed_purposes,current_use_ceiling on church_intel.evidence_claims for each row execute function church_intel.guard_claim_rights();
revoke execute on function church_intel.guard_source_record() from public,anon,authenticated,service_role;
revoke execute on function church_intel.guard_claim_rights() from public,anon,authenticated,service_role;

-- Force defense-in-depth RLS on all private tables.
do $$ declare t text; begin foreach t in array array['church_organizations','church_campuses','church_sites','campus_site_links','source_registry','source_records','evidence_claims','geo_boundary_versions','site_geo_memberships','review_cases','church_system_links'] loop
 execute format('alter table church_intel.%I enable row level security',t); execute format('alter table church_intel.%I force row level security',t);
 execute format('revoke all on church_intel.%I from public,anon,authenticated,service_role',t);
 execute format('create policy %I on church_intel.%I for select to church_intel_api_owner using ((select public.kb_is_platform_admin()))','ci_'||t||'_select',t);
 execute format('create policy %I on church_intel.%I for insert to church_intel_api_owner with check ((select public.kb_is_platform_admin()))','ci_'||t||'_insert',t);
 execute format('create policy %I on church_intel.%I for update to church_intel_api_owner using ((select public.kb_is_platform_admin())) with check ((select public.kb_is_platform_admin()))','ci_'||t||'_update',t);
 end loop; end $$;
grant select,insert,update on all tables in schema church_intel to church_intel_api_owner;

-- Exact SECURITY DEFINER dependency wiring. No membership in broad platform roles.
grant usage on schema public,auth,extensions to church_intel_api_owner;
grant execute on function public.kb_is_platform_admin() to church_intel_api_owner;
grant execute on function auth.jwt() to church_intel_api_owner;
grant execute on function auth.uid() to church_intel_api_owner;
grant insert on public.admin_audit_log to church_intel_api_owner;
grant select(id,slug,city,state_code,active) on public.geo_places to church_intel_api_owner;
grant select(id,slug,active) on public.geo_markets to church_intel_api_owner;
revoke all on public.profiles,public.growth_churches,public.gpi_organizations from church_intel_api_owner;
revoke all on concierge_ops.organizations from church_intel_api_owner;
revoke usage on schema concierge_ops from church_intel_api_owner;

create policy kb_admin_audit_log_ci_insert on public.admin_audit_log for insert to church_intel_api_owner
 with check ((select public.kb_is_platform_admin()) and admin_id=(select auth.uid()));
create policy geo_places_ci_select on public.geo_places for select to church_intel_api_owner using (active);
create policy geo_markets_ci_select on public.geo_markets for select to church_intel_api_owner using (active);

create function church_intel.assert_admin() returns uuid language plpgsql stable set search_path='' as $$
declare u uuid;
begin u:=auth.uid(); if u is null or not coalesce(public.kb_is_platform_admin(),false) then raise exception using errcode='42501',message='platform administrator required'; end if; return u; end $$;
create function church_intel.audit(p_action text,p_table text,p_id text,p_reason text,p_before jsonb,p_after jsonb,p_meta jsonb default '{}'::jsonb)
returns void language sql set search_path='' as $$ insert into public.admin_audit_log(admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta) values(auth.uid(),p_action,p_table,p_id,p_reason,p_before,p_after,p_meta) $$;
alter function church_intel.assert_admin() owner to church_intel_api_owner;
alter function church_intel.audit(text,text,text,text,jsonb,jsonb,jsonb) owner to church_intel_api_owner;
revoke execute on function church_intel.assert_admin() from public,anon,authenticated,service_role;
revoke execute on function church_intel.audit(text,text,text,text,jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;

-- Purpose-filtered reads.
create function public.ci_list_organizations(p_requested_purpose text,p_limit integer default 50)
returns jsonb language sql stable security definer set search_path='' as $$
 select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'canonical_name'),'[]'::jsonb) end
 from (select jsonb_build_object('id',o.id,'canonical_name',o.canonical_name,'operating_state',o.operating_state) x
       from church_intel.church_organizations o where exists(select 1 from church_intel.evidence_claims c where c.organization_id=o.id and c.claim_status='promoted' and p_requested_purpose=any(c.allowed_purposes) and p_requested_purpose=any(c.current_use_ceiling))
       order by o.canonical_name limit least(greatest(coalesce(p_limit,50),1),100)) q $$;

create function public.ci_get_organization(p_organization_id uuid,p_requested_purpose text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare out_doc jsonb;
begin perform church_intel.assert_admin();
 select jsonb_build_object('organization',to_jsonb(o)-'created_by'-'updated_by','campuses',coalesce((select jsonb_agg(to_jsonb(c)-'created_by'-'updated_by') from church_intel.church_campuses c where c.organization_id=o.id),'[]'::jsonb),'claims',coalesce((select jsonb_agg(to_jsonb(e)-'created_by'-'promoted_by') from church_intel.evidence_claims e where e.organization_id=o.id and p_requested_purpose=any(e.allowed_purposes) and p_requested_purpose=any(e.current_use_ceiling)),'[]'::jsonb)) into out_doc
 from church_intel.church_organizations o where o.id=p_organization_id;
 return out_doc;
end $$;

create function public.ci_create_research_bundle(p_bundle jsonb,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; oid uuid; cid uuid; sid uuid; srid uuid; clid uuid; src uuid;
begin actor:=church_intel.assert_admin();
 src:=(p_bundle->>'source_id')::uuid;
 insert into church_intel.church_organizations(canonical_name,operating_state,created_by,updated_by) values(p_bundle->>'canonical_name',coalesce(p_bundle->>'operating_state','unknown'),actor,actor) returning id into oid;
 insert into church_intel.church_campuses(organization_id,campus_name,is_primary,created_by,updated_by) values(oid,coalesce(p_bundle->>'campus_name',p_bundle->>'canonical_name'),true,actor,actor) returning id into cid;
 insert into church_intel.church_sites(address_line_1,address_line_2,locality,region_code,postal_code,normalized_address,latitude,longitude,geocode_method,geocode_precision,created_by,updated_by)
 values(p_bundle->>'address_line_1',p_bundle->>'address_line_2',p_bundle->>'locality',p_bundle->>'region_code',p_bundle->>'postal_code',p_bundle->>'normalized_address',(p_bundle->>'latitude')::numeric,(p_bundle->>'longitude')::numeric,p_bundle->>'geocode_method',p_bundle->>'geocode_precision',actor,actor) returning id into sid;
 insert into church_intel.source_records(source_id,source_external_key,source_url,retrieved_at,content_hash,extraction_hash,parser_version,retention_mode,retained_payload,retained_excerpt,rebuild_manifest,source_license_snapshot,source_metadata,created_by)
 values(src,p_bundle->>'source_external_key',p_bundle->>'source_url',now(),p_bundle->>'content_hash',p_bundle->>'extraction_hash',p_bundle->>'parser_version',p_bundle->>'retention_mode',p_bundle->'retained_payload',p_bundle->>'retained_excerpt',p_bundle->'rebuild_manifest',coalesce(p_bundle->'source_license_snapshot','{}'::jsonb),coalesce(p_bundle->'source_metadata','{}'::jsonb),actor) returning id into srid;
 insert into church_intel.evidence_claims(source_record_id,organization_id,attribute_key,asserted_value,allowed_purposes,current_use_ceiling,observed_at,created_by)
 values(srid,oid,'canonical_name',to_jsonb(p_bundle->>'canonical_name'),array(select jsonb_array_elements_text(p_bundle->'allowed_purposes')),array(select jsonb_array_elements_text(p_bundle->'allowed_purposes')),now(),actor) returning id into clid;
 insert into church_intel.campus_site_links(campus_id,site_id,site_role,supporting_evidence_claim_id,created_by) values(cid,sid,'primary',clid,actor);
 perform church_intel.audit('church_intel.bundle_created','church_intel.church_organizations',oid::text,p_reason,null,jsonb_build_object('organization_id',oid,'campus_id',cid,'site_id',sid,'source_record_id',srid,'claim_id',clid));
 return jsonb_build_object('organization_id',oid,'campus_id',cid,'site_id',sid,'source_record_id',srid,'claim_id',clid);
end $$;

create function public.ci_promote_claim(p_claim_id uuid,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; c church_intel.evidence_claims%rowtype; old_id uuid;
begin actor:=church_intel.assert_admin(); select * into c from church_intel.evidence_claims where id=p_claim_id for update; if not found then raise exception 'claim not found'; end if;
 select id into old_id from church_intel.evidence_claims where claim_status='promoted' and attribute_key=c.attribute_key and organization_id is not distinct from c.organization_id and campus_id is not distinct from c.campus_id and site_id is not distinct from c.site_id for update;
 if old_id is not null and old_id<>p_claim_id then update church_intel.evidence_claims set claim_status='superseded',superseded_by_claim_id=p_claim_id,valid_to=now() where id=old_id; end if;
 update church_intel.evidence_claims set claim_status='promoted',promoted_at=now(),promoted_by=actor where id=p_claim_id;
 perform church_intel.audit('church_intel.claim_promoted','church_intel.evidence_claims',p_claim_id::text,p_reason,jsonb_build_object('prior_claim_id',old_id),jsonb_build_object('claim_id',p_claim_id)); return p_claim_id;
end $$;

create function public.ci_stage_claim(p_source_record_id uuid,p_organization_id uuid,p_campus_id uuid,p_site_id uuid,p_attribute_key text,p_value jsonb,p_allowed text[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; cid uuid; begin actor:=church_intel.assert_admin(); insert into church_intel.evidence_claims(source_record_id,organization_id,campus_id,site_id,attribute_key,asserted_value,allowed_purposes,current_use_ceiling,observed_at,created_by) values(p_source_record_id,p_organization_id,p_campus_id,p_site_id,p_attribute_key,p_value,p_allowed,p_allowed,now(),actor) returning id into cid; return cid; end $$;

create function public.ci_apply_source_policy_restriction(p_source_id uuid,p_allowed text[],p_reason text) returns integer language plpgsql security definer set search_path='' as $$
declare actor uuid; n int; before_row jsonb; old_allowed text[];
begin actor:=church_intel.assert_admin(); select to_jsonb(s),s.default_allowed_purposes into before_row,old_allowed from church_intel.source_registry s where id=p_source_id for update; if before_row is null then raise exception 'source not found'; end if;
 if not (p_allowed <@ old_allowed) then raise exception using errcode='55000',message='source policy path may only restrict purposes'; end if;
 update church_intel.source_registry set default_allowed_purposes=p_allowed,policy_version=policy_version+1,policy_effective_at=now(),updated_at=now(),updated_by=actor where id=p_source_id;
 update church_intel.evidence_claims c set current_use_ceiling=array(select unnest(c.current_use_ceiling) intersect select unnest(p_allowed)) where c.source_record_id in(select id from church_intel.source_records where source_id=p_source_id); get diagnostics n=row_count;
 perform church_intel.audit('church_intel.source_policy_restricted','church_intel.source_registry',p_source_id::text,p_reason,before_row,(select to_jsonb(s) from church_intel.source_registry s where id=p_source_id),jsonb_build_object('affected_claims',n)); return n;
end $$;

create function public.ci_reduce_source_retention(p_source_record_id uuid,p_new_mode text,p_payload jsonb,p_excerpt text,p_manifest jsonb,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; before_row jsonb;
begin actor:=church_intel.assert_admin(); select to_jsonb(r) into before_row from church_intel.source_records r where id=p_source_record_id for update; if before_row is null then raise exception 'source record not found'; end if;
 update church_intel.source_records set retention_mode=p_new_mode,retained_payload=p_payload,retained_excerpt=p_excerpt,rebuild_manifest=p_manifest,retention_revision=retention_revision+1,retention_reduced_at=now(),retention_reduced_by=actor,retention_reduction_reason=p_reason where id=p_source_record_id;
 perform church_intel.audit('church_intel.retention_reduced','church_intel.source_records',p_source_record_id::text,p_reason,jsonb_build_object('mode',before_row->>'retention_mode','content_hash',before_row->>'content_hash','extraction_hash',before_row->>'extraction_hash'),(select jsonb_build_object('mode',retention_mode,'content_hash',content_hash,'extraction_hash',extraction_hash) from church_intel.source_records where id=p_source_record_id)); return p_source_record_id;
end $$;

create function public.ci_open_review_case(p_case_type text,p_severity text,p_organization_id uuid,p_campus_id uuid,p_site_id uuid,p_payload jsonb,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; rid uuid; begin actor:=church_intel.assert_admin(); insert into church_intel.review_cases(case_type,severity,subject_organization_id,subject_campus_id,subject_site_id,case_payload,created_by,updated_by) values(p_case_type,p_severity,p_organization_id,p_campus_id,p_site_id,coalesce(p_payload,'{}'::jsonb),actor,actor) returning id into rid; perform church_intel.audit('church_intel.review_opened','church_intel.review_cases',rid::text,p_reason,null,jsonb_build_object('id',rid)); return rid; end $$;
create function public.ci_resolve_review_case(p_review_id uuid,p_status text,p_resolution jsonb,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; before_row jsonb; begin actor:=church_intel.assert_admin(); select to_jsonb(r) into before_row from church_intel.review_cases r where id=p_review_id for update; update church_intel.review_cases set status=p_status,resolution=p_resolution,resolved_at=now(),resolved_by=actor,updated_at=now(),updated_by=actor where id=p_review_id; if not found then raise exception 'review not found'; end if; perform church_intel.audit('church_intel.review_resolved','church_intel.review_cases',p_review_id::text,p_reason,before_row,(select to_jsonb(r) from church_intel.review_cases r where id=p_review_id)); return p_review_id; end $$;

create function public.ci_record_site_membership(p_site_id uuid,p_boundary_id uuid,p_result text,p_method text,p_algorithm text,p_longitude numeric,p_latitude numeric,p_precision text,p_geocode_method text,p_distance numeric,p_reason text,p_review_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; old_id uuid; new_id uuid:=extensions.gen_random_uuid(); pnt extensions.geometry; bnd extensions.geometry; computed_result text; computed_distance numeric; effective_review uuid:=p_review_id;
begin actor:=church_intel.assert_admin(); select boundary into bnd from church_intel.geo_boundary_versions where id=p_boundary_id and publication_status='published'; if bnd is null then raise exception using errcode='55000',message='published boundary required'; end if;
 pnt:=extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326);
 if p_method='manual_override' then computed_result:=p_result; computed_distance:=p_distance; if effective_review is null then raise exception using errcode='23514',message='manual override requires review case'; end if;
 else computed_distance:=extensions.st_distance(pnt::extensions.geography,extensions.st_boundary(bnd)::extensions.geography);
   if p_precision in ('city','postal','unknown') or extensions.st_touches(bnd,pnt) or computed_distance<=50 then computed_result:='review';
     if effective_review is null then insert into church_intel.review_cases(case_type,severity,subject_site_id,case_payload,created_by,updated_by) values('boundary','normal',p_site_id,jsonb_build_object('boundary_version_id',p_boundary_id,'distance_m',computed_distance,'precision',p_precision),actor,actor) returning id into effective_review; end if;
   elsif extensions.st_covers(bnd,pnt) then computed_result:='included'; else computed_result:='excluded'; end if;
 end if;
 select id into old_id from church_intel.site_geo_memberships where site_id=p_site_id and boundary_version_id=p_boundary_id and is_current for update;
 if old_id is not null then update church_intel.site_geo_memberships set is_current=false,superseded_at=now(),superseded_by_membership_id=new_id,supersession_reason=p_reason where id=old_id; end if;
 insert into church_intel.site_geo_memberships(id,site_id,boundary_version_id,membership_result,evaluation_method,evaluation_algorithm_version,coordinate_snapshot,geocode_precision_snapshot,geocode_method_snapshot,distance_to_boundary_m,reason,review_case_id,evaluated_at,evaluated_by) values(new_id,p_site_id,p_boundary_id,computed_result,p_method,p_algorithm,pnt,p_precision,p_geocode_method,computed_distance,p_reason,effective_review,now(),actor);
 perform church_intel.audit('church_intel.membership_recorded','church_intel.site_geo_memberships',new_id::text,p_reason,jsonb_build_object('superseded_id',old_id),jsonb_build_object('id',new_id)); return new_id; end $$;

create function public.ci_set_system_link(p_organization_id uuid,p_system_key text,p_profile_id uuid,p_growth_id uuid,p_concierge_id uuid,p_gpi_id uuid,p_status text,p_evidence_id uuid,p_review_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; lid uuid:=extensions.gen_random_uuid(); old_id uuid;
begin actor:=church_intel.assert_admin();
 if p_status='active' then select id into old_id from church_intel.church_system_links where organization_id=p_organization_id and system_key=p_system_key and link_status='active' for update; end if;
 if old_id is not null then update church_intel.church_system_links set link_status='superseded',valid_to=now(),superseded_by_link_id=lid,resolution_reason=p_reason,updated_at=now(),updated_by=actor where id=old_id; end if;
 insert into church_intel.church_system_links(id,organization_id,system_key,faithbid_profile_id,growth_church_id,concierge_organization_id,gpi_organization_id,link_status,evidence_claim_id,review_case_id,valid_from,resolution_reason,created_by,updated_by)
 values(lid,p_organization_id,p_system_key,p_profile_id,p_growth_id,p_concierge_id,p_gpi_id,p_status,p_evidence_id,p_review_id,case when p_status='active' then now() end,p_reason,actor,actor);
 perform church_intel.audit('church_intel.system_link_set','church_intel.church_system_links',lid::text,p_reason,jsonb_build_object('superseded_id',old_id),jsonb_build_object('id',lid,'status',p_status)); return lid;
end $$;

create function public.ci_stage_dallas_boundary(p_source_record_id uuid,p_native_wkt text,p_version_label text,p_transformation_metadata jsonb,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; place_id uuid; native_geom extensions.geometry; normalized extensions.geometry; bid uuid; h text;
begin actor:=church_intel.assert_admin();
 select id into place_id from public.geo_places where slug='dallas-tx' and city='Dallas' and state_code='TX' and active; if place_id is null then raise exception 'active Dallas geo_place not found'; end if;
 native_geom:=extensions.st_setsrid(extensions.st_geomfromtext(p_native_wkt),2276);
 normalized:=extensions.st_multi(extensions.st_normalize(extensions.st_forcerhr(extensions.st_unaryunion(extensions.st_collectionextract(extensions.st_makevalid(extensions.st_removerepeatedpoints(extensions.st_snaptogrid(extensions.st_transform(extensions.st_unaryunion(extensions.st_collectionextract(extensions.st_makevalid(native_geom),3)),4326),0.00000001))),3)))));
 if extensions.st_isempty(normalized) or not extensions.st_isvalid(normalized) or extensions.geometrytype(normalized)<>'MULTIPOLYGON' then raise exception using errcode='22023',message='normalized Dallas boundary is invalid'; end if;
 h:=encode(extensions.digest(extensions.st_asewkb(normalized,'NDR'),'sha256'),'hex');
 insert into church_intel.geo_boundary_versions(geo_place_id,boundary_scope,source_record_id,version_label,source_srid,normalization_procedure_version,transformation_metadata,boundary,geometry_hash,publication_status,created_by)
 values(place_id,'city',p_source_record_id,p_version_label,2276,'dallas_boundary_norm_v1',p_transformation_metadata||jsonb_build_object('normalized_hash',h,'source_srid',2276,'normalized_srid',4326,'ewkb_endian','NDR'),normalized,h,'draft',actor) returning id into bid;
 perform church_intel.audit('church_intel.boundary_staged','church_intel.geo_boundary_versions',bid::text,p_reason,null,jsonb_build_object('id',bid,'geometry_hash',h)); return bid;
end $$;

create function public.ci_publish_boundary(p_boundary_id uuid,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; b church_intel.geo_boundary_versions%rowtype;
begin actor:=church_intel.assert_admin(); select * into b from church_intel.geo_boundary_versions where id=p_boundary_id for update; if not found or b.publication_status<>'draft' then raise exception using errcode='55000',message='only a draft boundary can be published'; end if;
 update church_intel.geo_boundary_versions set publication_status='superseded',effective_to=now() where publication_status='published' and effective_to is null and geo_place_id is not distinct from b.geo_place_id and geo_market_id is not distinct from b.geo_market_id and boundary_scope=b.boundary_scope;
 update church_intel.geo_boundary_versions set publication_status='published',published_at=now(),published_by=actor,effective_from=coalesce(effective_from,now()) where id=p_boundary_id;
 perform church_intel.audit('church_intel.boundary_published','church_intel.geo_boundary_versions',p_boundary_id::text,p_reason,null,jsonb_build_object('id',p_boundary_id,'geometry_hash',b.geometry_hash)); return p_boundary_id;
end $$;

-- RPC owner and execute ACLs are explicit; PUBLIC gets nothing by default.
grant create on schema public,church_intel to church_intel_api_owner;
alter function public.ci_list_organizations(text,integer) owner to church_intel_api_owner;
alter function public.ci_get_organization(uuid,text) owner to church_intel_api_owner;
alter function public.ci_create_research_bundle(jsonb,text) owner to church_intel_api_owner;
alter function public.ci_promote_claim(uuid,text) owner to church_intel_api_owner;
alter function public.ci_stage_claim(uuid,uuid,uuid,uuid,text,jsonb,text[]) owner to church_intel_api_owner;
alter function public.ci_apply_source_policy_restriction(uuid,text[],text) owner to church_intel_api_owner;
alter function public.ci_reduce_source_retention(uuid,text,jsonb,text,jsonb,text) owner to church_intel_api_owner;
alter function public.ci_open_review_case(text,text,uuid,uuid,uuid,jsonb,text) owner to church_intel_api_owner;
alter function public.ci_resolve_review_case(uuid,text,jsonb,text) owner to church_intel_api_owner;
alter function public.ci_record_site_membership(uuid,uuid,text,text,text,numeric,numeric,text,text,numeric,text,uuid) owner to church_intel_api_owner;
alter function public.ci_set_system_link(uuid,text,uuid,uuid,uuid,uuid,text,uuid,uuid,text) owner to church_intel_api_owner;
alter function public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text) owner to church_intel_api_owner;
alter function public.ci_publish_boundary(uuid,text) owner to church_intel_api_owner;
revoke create on schema public,church_intel from church_intel_api_owner;
revoke church_intel_api_owner from postgres;

do $$ declare f regprocedure; begin foreach f in array array[
 'public.ci_list_organizations(text,integer)'::regprocedure,'public.ci_get_organization(uuid,text)'::regprocedure,'public.ci_create_research_bundle(jsonb,text)'::regprocedure,'public.ci_promote_claim(uuid,text)'::regprocedure,'public.ci_stage_claim(uuid,uuid,uuid,uuid,text,jsonb,text[])'::regprocedure,'public.ci_apply_source_policy_restriction(uuid,text[],text)'::regprocedure,'public.ci_reduce_source_retention(uuid,text,jsonb,text,jsonb,text)'::regprocedure,'public.ci_open_review_case(text,text,uuid,uuid,uuid,jsonb,text)'::regprocedure,'public.ci_resolve_review_case(uuid,text,jsonb,text)'::regprocedure,'public.ci_record_site_membership(uuid,uuid,text,text,text,numeric,numeric,text,text,numeric,text,uuid)'::regprocedure,'public.ci_set_system_link(uuid,text,uuid,uuid,uuid,uuid,text,uuid,uuid,text)'::regprocedure,'public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text)'::regprocedure,'public.ci_publish_boundary(uuid,text)'::regprocedure
 ] loop execute format('revoke execute on function %s from public,anon,service_role',f); execute format('grant execute on function %s to authenticated',f); end loop; end $$;

comment on schema church_intel is 'Private canonical research/evidence domain for the FaithBid internal Church Intelligence module; not an independent product or operational CRM.';
comment on role church_intel_api_owner is 'NOLOGIN, NOINHERIT owner for narrow Church Intelligence SECURITY DEFINER RPCs; never a member of authenticated or service_role.';
comment on table church_intel.church_organizations is 'Church Intelligence canonical research organization; relationship and marketplace state remain externally owned.';
comment on table church_intel.church_campuses is 'Church Intelligence canonical campus belonging to exactly one canonical organization.';
comment on table church_intel.church_sites is 'Reusable physical site/address research object; not a FaithBid geography registry.';
comment on table church_intel.campus_site_links is 'Temporal role-bearing link between a campus and a physical site.';
comment on table church_intel.source_registry is 'Current source policy and acquisition defaults; consequential changes are also written to the FaithBid admin audit log.';
comment on table church_intel.source_records is 'Immutable source provenance with reduction-only retained-content history.';
comment on table church_intel.evidence_claims is 'Purpose-scoped evidence attached by real FK to exactly one canonical subject; allowed_purposes is the immutable effective-rights snapshot.';
comment on table church_intel.geo_boundary_versions is 'Versioned City/County/Metro boundary geometry referencing the existing FaithBid geography registry; Dallas city authority uses geo_places.';
comment on table church_intel.review_cases is 'Research-only review workflow; not Growth/Concierge relationship ownership or Marketplace project state.';
comment on table church_intel.site_geo_memberships is 'Append/supersede result of evaluating one site against one immutable boundary version.';
comment on table church_intel.church_system_links is 'Generic evidence-backed bridge to existing FaithBid operational records; it does not transfer system ownership.';
