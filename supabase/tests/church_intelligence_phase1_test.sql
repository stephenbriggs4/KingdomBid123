begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();

-- AT-01/02 structural hierarchy and strong claim subject.
select is((select count(*)::int from pg_tables where schemaname='church_intel'),11,'exactly eleven Church Intelligence tables');
select ok(to_regclass('church_intel.church_organizations') is not null,'organization table exists');
select ok(to_regclass('church_intel.church_campuses') is not null,'campus table exists');
select ok(to_regclass('church_intel.church_sites') is not null,'site table exists');
select matches(pg_get_constraintdef((select oid from pg_constraint where conrelid='church_intel.evidence_claims'::regclass and conname='ci_claim_subject_ck')),'num_nonnulls','claim has exactly one strong subject');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated','ci-admin@example.test','',now(),' {"roles":["platform_admin"]}'::jsonb,'{}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated','ci-church@example.test','',now(),'{}','{}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333333','authenticated','authenticated','ci-former@example.test','',now(),'{}','{}',now(),now());

insert into church_intel.church_organizations(id,canonical_name,created_by) values
 ('aaaaaaaa-0000-0000-0000-000000000001','Alpha Church','11111111-1111-1111-1111-111111111111'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Beta Church','11111111-1111-1111-1111-111111111111');
insert into church_intel.church_campuses(id,organization_id,campus_name,is_primary) values('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Alpha Main',true);
insert into church_intel.church_sites(id,address_line_1,locality,region_code,normalized_address,latitude,longitude,geocode_method,geocode_precision) values('cccccccc-0000-0000-0000-000000000001','1 Main St','Dallas','TX','1 main st dallas tx',32.78,-96.80,'fixture','rooftop');
insert into church_intel.source_registry(id,source_key,display_name,independence_family_key,authority_class,access_method,terms_checked_at,default_allowed_purposes,automation_status,retention_rule,policy_effective_at)
values('dddddddd-0000-0000-0000-000000000001','fixture_open','Fixture Open','fixture_family','official','manual',now(),array['research','export'],'manual_only','test only',now());
insert into church_intel.source_records(id,source_id,source_external_key,retrieved_at,content_hash,extraction_hash,parser_version,retention_mode,retained_payload,created_by)
values('eeeeeeee-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001','alpha',now(),repeat('a',64),repeat('b',64),'test-v1','payload','{"name":"Alpha"}','11111111-1111-1111-1111-111111111111');
insert into church_intel.source_records(id,source_id,source_external_key,retrieved_at,content_hash,extraction_hash,parser_version,retention_mode,rebuild_manifest,created_by)
values('eeeeeeee-0000-0000-0000-000000000003','dddddddd-0000-0000-0000-000000000001','dallas-boundary',now(),repeat('c',64),repeat('d',64),'test-v1','manifest_only','{"fixture":true}','11111111-1111-1111-1111-111111111111');
insert into church_intel.evidence_claims(id,source_record_id,organization_id,attribute_key,asserted_value,allowed_purposes,current_use_ceiling,observed_at)
values('ffffffff-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','canonical_name','"Alpha Church"',array['research','export'],array['research','export'],now());
insert into church_intel.campus_site_links(campus_id,site_id,site_role,supporting_evidence_claim_id) values('bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','primary','ffffffff-0000-0000-0000-000000000001');
select is((select organization_id from church_intel.church_campuses where id='bbbbbbbb-0000-0000-0000-000000000001'),'aaaaaaaa-0000-0000-0000-000000000001'::uuid,'organization-campus FK path');
select throws_ok($$insert into church_intel.evidence_claims(source_record_id,attribute_key,asserted_value,allowed_purposes,current_use_ceiling,observed_at) values('eeeeeeee-0000-0000-0000-000000000001','bad','1',array['research'],array['research'],now())$$,'23514',null,'zero-subject claim rejected');
select throws_ok($$insert into church_intel.evidence_claims(source_record_id,organization_id,campus_id,attribute_key,asserted_value,allowed_purposes,current_use_ceiling,observed_at) values('eeeeeeee-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','bad','1',array['research'],array['research'],now())$$,'23514',null,'multi-subject claim rejected');

-- AT-03 retention, rights narrowing, and source-family determinism.
select throws_ok($$insert into church_intel.source_records(source_id,source_external_key,retrieved_at,content_hash,extraction_hash,parser_version,retention_mode,retained_payload) values('dddddddd-0000-0000-0000-000000000001','bad',now(),repeat('c',64),repeat('d',64),'v','metadata_only','{}')$$,'23514',null,'metadata-only payload rejected');
select throws_ok($$update church_intel.evidence_claims set allowed_purposes=array['research'] where id='ffffffff-0000-0000-0000-000000000001'$$,'55000',null,'historical permissions immutable');
select is((select count(distinct independence_family_key)::int from church_intel.source_registry where source_key='fixture_open'),1,'independence count uses family key');

-- AT-04/10 full authenticated admin -> SECURITY DEFINER owner -> helper -> private write -> audit chain.
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"roles":["platform_admin"]}}',true);
set local role authenticated;
select lives_ok($$select public.ci_open_review_case('correction','normal','aaaaaaaa-0000-0000-0000-000000000001',null,null,'{}','runtime chain')$$,'admin RPC runtime chain succeeds');
reset role;
select ok(exists(select 1 from public.admin_audit_log where action='church_intel.review_opened' and admin_id='11111111-1111-1111-1111-111111111111'),'RPC emitted required audit row');
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","app_metadata":{}}',true);
set local role authenticated;
select throws_ok($$select public.ci_open_review_case('correction','normal','aaaaaaaa-0000-0000-0000-000000000001',null,null,'{}','denied')$$,'42501',null,'ordinary authenticated user denied');
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select throws_ok($$select public.ci_list_organizations('research',10)$$,'42501',null,'anonymous user denied');
reset role;

-- Apply a restriction and prove historical snapshot/current ceiling behavior.
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"roles":["platform_admin"]}}',true);
set local role authenticated;
select is(public.ci_apply_source_policy_restriction('dddddddd-0000-0000-0000-000000000001',array['research'],'rights changed'),1,'restrictive policy updates affected claim');
reset role;
select is((select allowed_purposes from church_intel.evidence_claims where id='ffffffff-0000-0000-0000-000000000001'),array['research','export']::text[],'historical rights preserved');
select is((select current_use_ceiling from church_intel.evidence_claims where id='ffffffff-0000-0000-0000-000000000001'),array['research']::text[],'current use narrowed');
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"roles":["platform_admin"]}}',true);
set local role authenticated;
select lives_ok($$select public.ci_reduce_source_retention('eeeeeeee-0000-0000-0000-000000000001','excerpt',null,'Alpha',null,'retention change')$$,'authorized retention reduction succeeds');
reset role;
select is((select retention_mode from church_intel.source_records where id='eeeeeeee-0000-0000-0000-000000000001'),'excerpt','retention mode reduced');
select is((select content_hash from church_intel.source_records where id='eeeeeeee-0000-0000-0000-000000000001'),repeat('a',64),'provenance hash preserved');
select throws_ok($$update church_intel.source_records set retention_mode='payload',retained_payload='{}',retained_excerpt=null where id='eeeeeeee-0000-0000-0000-000000000001'$$,'55000',null,'retention expansion rejected');

-- AT-05/06 same-boundary append/supersede and review requirement.
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"roles":["platform_admin"]}}',true);
set local role authenticated;
select lives_ok($$select public.ci_stage_dallas_boundary(
  'eeeeeeee-0000-0000-0000-000000000003',
  extensions.st_astext(extensions.st_transform(extensions.st_geomfromtext('POLYGON((-97 32,-96 32,-96 33,-97 33,-97 32))',4326),2276)),
  'rpc-stage-fixture','{"fixture":true}'::jsonb,'boundary staging test')$$,
  'native EPSG:2276 Dallas boundary staging succeeds');
reset role;
select is((select extensions.st_srid(boundary) from church_intel.geo_boundary_versions where version_label='rpc-stage-fixture'),4326,'staged boundary is normalized to EPSG:4326');
select ok((select extensions.st_isvalid(boundary) and extensions.geometrytype(boundary)='MULTIPOLYGON' and length(geometry_hash)=64 from church_intel.geo_boundary_versions where version_label='rpc-stage-fixture'),'staged boundary is valid multipolygon with normalized hash');

insert into church_intel.geo_boundary_versions(id,geo_place_id,boundary_scope,source_record_id,version_label,source_srid,normalization_procedure_version,transformation_metadata,boundary,geometry_hash,publication_status,published_at)
select '12345678-0000-0000-0000-000000000001',id,'city','eeeeeeee-0000-0000-0000-000000000001','fixture-v1',2276,'dallas_boundary_norm_v1','{}',extensions.st_multi(extensions.st_geomfromtext('POLYGON((-97 32,-96 32,-96 33,-97 33,-97 32))',4326)),repeat('f',64),'published',now() from public.geo_places where slug='dallas-tx' limit 1;
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{"roles":["platform_admin"]}}',true);
set local role authenticated;
select lives_ok($$select public.ci_record_site_membership('cccccccc-0000-0000-0000-000000000001','12345678-0000-0000-0000-000000000001','included','point_in_polygon','v1',-96.8,32.78,'rooftop','fixture',100,'first',null)$$,'first membership recorded');
select lives_ok($$select public.ci_record_site_membership('cccccccc-0000-0000-0000-000000000001','12345678-0000-0000-0000-000000000001','included','point_in_polygon','v1',-96.79,32.79,'rooftop','fixture',120,'better geocode',null)$$,'same-boundary replacement recorded');
select lives_ok($$select public.ci_record_site_membership('cccccccc-0000-0000-0000-000000000001','12345678-0000-0000-0000-000000000001','included','point_in_polygon','v1',-96.99999,32.5,'rooftop','fixture',999,'near boundary',null)$$,'near-boundary evaluation creates review case');
reset role;
select is((select count(*)::int from church_intel.site_geo_memberships where site_id='cccccccc-0000-0000-0000-000000000001'),3,'all membership evaluations retained');
select is((select count(*)::int from church_intel.site_geo_memberships where site_id='cccccccc-0000-0000-0000-000000000001' and is_current),1,'only one current membership');
select is((select membership_result from church_intel.site_geo_memberships where site_id='cccccccc-0000-0000-0000-000000000001' and is_current),'review','near-boundary result is review');
select ok((select review_case_id is not null from church_intel.site_geo_memberships where site_id='cccccccc-0000-0000-0000-000000000001' and is_current),'near-boundary result links generated review case');
select throws_ok($$insert into church_intel.site_geo_memberships(site_id,boundary_version_id,membership_result,evaluation_method,evaluation_algorithm_version,coordinate_snapshot,geocode_precision_snapshot,geocode_method_snapshot,distance_to_boundary_m,reason,evaluated_at) values('cccccccc-0000-0000-0000-000000000001','12345678-0000-0000-0000-000000000001','review','point_in_polygon','v1',extensions.st_setsrid(extensions.st_makepoint(-96.8,32.8),4326),'rooftop','fixture',1,'near',now())$$,'23514',null,'review membership requires review case');

-- AT-07/08 reversible history and system-link cardinality are enforced structurally.
select ok((select condeferrable from pg_constraint where conname='ci_membership_superseded_fk'),'membership successor FK is deferred for atomic replacement');
select ok(to_regclass('church_intel.ci_link_singleton_uq') is not null,'one active Growth/Concierge/GPI link per canonical org');
select ok(to_regclass('church_intel.ci_link_profile_external_uq') is not null,'external profile links to at most one canonical org');
insert into public.growth_churches(id,name) values('99999999-0000-0000-0000-000000000001','CI test Growth church');
insert into church_intel.church_system_links(organization_id,system_key,growth_church_id,link_status,evidence_claim_id) values('aaaaaaaa-0000-0000-0000-000000000001','growth_church','99999999-0000-0000-0000-000000000001','active','ffffffff-0000-0000-0000-000000000001');
select throws_ok($$insert into church_intel.church_system_links(organization_id,system_key,growth_church_id,link_status,evidence_claim_id) values('aaaaaaaa-0000-0000-0000-000000000002','growth_church','99999999-0000-0000-0000-000000000001','active','ffffffff-0000-0000-0000-000000000001')$$,'23505',null,'external operational record cannot actively link twice');

-- AT-09 exact external privileges and zero operational writes.
select ok(has_column_privilege('church_intel_api_owner','public.profiles','org_name','SELECT'),'narrow Profiles organization-name read');
select ok(has_column_privilege('church_intel_api_owner','public.profiles','denomination','SELECT'),'narrow Profiles denomination read');
select ok(not has_column_privilege('church_intel_api_owner','public.profiles','email','SELECT'),'no Profiles contact/email read');
select ok(not has_table_privilege('church_intel_api_owner','public.profiles','SELECT'),'no whole Profiles-table read');
select ok(not has_table_privilege('church_intel_api_owner','public.growth_churches','SELECT'),'no Growth read');
select ok(not has_table_privilege('church_intel_api_owner','concierge_ops.organizations','SELECT'),'no Concierge read');
select ok(not has_table_privilege('church_intel_api_owner','public.gpi_organizations','SELECT'),'no GPI read');
select ok(not has_schema_privilege('church_intel_api_owner','concierge_ops','USAGE'),'no Concierge schema usage');
select ok(has_column_privilege('church_intel_api_owner','public.geo_places','slug','SELECT'),'narrow geography column read');
select ok(not has_table_privilege('church_intel_api_owner','public.geo_places','SELECT'),'no whole geography-table read');
select ok(has_table_privilege('church_intel_api_owner','public.admin_audit_log','INSERT'),'audit insert granted');
select ok(not has_table_privilege('church_intel_api_owner','public.admin_audit_log','UPDATE,DELETE'),'no audit update/delete');

-- AT-10 role/function/RLS execution context.
select ok(not (select rolinherit from pg_roles where rolname='church_intel_api_owner'),'API owner is NOINHERIT');
select ok(not (select rolcanlogin from pg_roles where rolname='church_intel_api_owner'),'API owner is NOLOGIN');
select is((select count(*)::int from pg_auth_members m join pg_roles r on r.oid=m.roleid join pg_roles u on u.oid=m.member where u.rolname='church_intel_api_owner' and r.rolname in('authenticated','service_role','anon')),0,'API owner inherits no broad role');
select ok(has_function_privilege('church_intel_api_owner','public.kb_is_platform_admin()','EXECUTE'),'API owner can call authoritative admin helper');
select ok(not has_schema_privilege('church_intel_api_owner','auth','USAGE'),'API owner has no direct Auth schema access');
select ok(has_function_privilege('church_intel_api_owner','church_intel.platform_admin_actor()','EXECUTE'),'API owner can invoke only the private admin-actor bridge');
insert into church_intel.source_records(id,source_id,source_external_key,retrieved_at,content_hash,extraction_hash,parser_version,retention_mode,created_by) values('eeeeeeee-0000-0000-0000-000000000002','dddddddd-0000-0000-0000-000000000001','former-actor',now(),repeat('1',64),repeat('2',64),'test-v1','metadata_only','33333333-3333-3333-3333-333333333333');
delete from auth.users where id='33333333-3333-3333-3333-333333333333';
select ok((select created_by is null from church_intel.source_records where id='eeeeeeee-0000-0000-0000-000000000002'),'actor deletion nulls attribution without deleting history');
select is((select count(*)::int from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='church_intel' and c.contype='f' and c.confrelid='auth.users'::regclass and c.confdeltype<>'n'),0,'all Church Intelligence auth-user FKs use SET NULL');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ci_%' and p.prosecdef and pg_get_userbyid(p.proowner)='church_intel_api_owner' and has_function_privilege('authenticated',p.oid,'EXECUTE') and not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('service_role',p.oid,'EXECUTE')),19,'all 19 public CI RPCs are owned narrowly and executable only by authenticated');
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='church_intel' and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity),11,'RLS enabled and forced on all 11 tables');
select is((select count(*)::int from pg_tables t where t.schemaname='church_intel' and (has_table_privilege('anon',format('%I.%I',t.schemaname,t.tablename),'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated',format('%I.%I',t.schemaname,t.tablename),'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('service_role',format('%I.%I',t.schemaname,t.tablename),'SELECT,INSERT,UPDATE,DELETE'))),0,'browser/service roles have no private base-table privileges');

select * from finish();
rollback;
