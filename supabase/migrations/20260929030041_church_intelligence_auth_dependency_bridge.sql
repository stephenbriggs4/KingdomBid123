-- Supabase owns and normalizes the auth schema ACL after migrations. Keep the
-- Church Intelligence API owner out of that schema and expose one narrow,
-- private authorization result instead.
create function church_intel.platform_admin_actor()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid;
begin
  actor := auth.uid();
  if actor is null or not coalesce(public.kb_is_platform_admin(), false) then
    raise exception using errcode = '42501', message = 'platform administrator required';
  end if;
  return actor;
end
$$;

comment on function church_intel.platform_admin_actor() is
  'Private SECURITY DEFINER bridge that returns only the verified platform-admin caller UUID; it exposes no Auth rows or JWT payload.';

revoke all on function church_intel.platform_admin_actor() from public, anon, authenticated, service_role;
grant execute on function church_intel.platform_admin_actor() to church_intel_api_owner;

-- Managed Supabase does not retain custom USAGE grants on auth. The API owner
-- deliberately has no direct Auth schema access after this migration.
revoke usage on schema auth from church_intel_api_owner;
revoke execute on function auth.jwt() from church_intel_api_owner;
revoke execute on function auth.uid() from church_intel_api_owner;

grant church_intel_api_owner to postgres;
grant create on schema church_intel to church_intel_api_owner;
set role church_intel_api_owner;

create or replace function church_intel.assert_admin()
returns uuid
language sql
stable
set search_path = ''
as $$
  select church_intel.platform_admin_actor()
$$;

create or replace function church_intel.audit(
  p_action text,
  p_table text,
  p_id text,
  p_reason text,
  p_before jsonb,
  p_after jsonb,
  p_meta jsonb default '{}'::jsonb
)
returns void
language sql
set search_path = ''
as $$
  insert into public.admin_audit_log(
    admin_id, action, target_table, target_id, reason,
    before_snapshot, after_snapshot, meta
  )
  values (
    church_intel.platform_admin_actor(), p_action, p_table, p_id, p_reason,
    p_before, p_after, p_meta
  )
$$;

reset role;
revoke create on schema church_intel from church_intel_api_owner;

alter policy kb_admin_audit_log_ci_insert on public.admin_audit_log
  with check (admin_id = (select church_intel.platform_admin_actor()));

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'church_organizations','church_campuses','church_sites','campus_site_links',
    'source_registry','source_records','evidence_claims','geo_boundary_versions',
    'site_geo_memberships','review_cases','church_system_links'
  ]
  loop
    policy_name := 'ci_' || table_name || '_select';
    execute format(
      'alter policy %I on church_intel.%I using ((select church_intel.platform_admin_actor()) is not null)',
      policy_name, table_name
    );

    policy_name := 'ci_' || table_name || '_insert';
    execute format(
      'alter policy %I on church_intel.%I with check ((select church_intel.platform_admin_actor()) is not null)',
      policy_name, table_name
    );

    policy_name := 'ci_' || table_name || '_update';
    execute format(
      'alter policy %I on church_intel.%I using ((select church_intel.platform_admin_actor()) is not null) with check ((select church_intel.platform_admin_actor()) is not null)',
      policy_name, table_name
    );
  end loop;
end
$$;

revoke church_intel_api_owner from postgres;
