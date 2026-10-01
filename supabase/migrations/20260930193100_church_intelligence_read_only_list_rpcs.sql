-- Church Intelligence read-only list RPCs for Research Queue, Sources, Boundary Versions, and System Links.
-- Mirrors the exact security pattern already proven by ci_list_organizations/ci_get_organization:
-- admin-gated via church_intel.assert_admin(), SECURITY DEFINER, owned by church_intel_api_owner,
-- empty search_path, execute granted only to authenticated. No new tables, no schema changes,
-- no architecture change -- these are the missing reads for RPCs that already exist.

create function public.ci_list_review_cases(p_status text default null, p_limit integer default 50)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', r.id,
      'case_type', r.case_type,
      'severity', r.severity,
      'status', r.status,
      'subject_organization_id', r.subject_organization_id,
      'subject_campus_id', r.subject_campus_id,
      'subject_site_id', r.subject_site_id,
      'owner_user_id', r.owner_user_id,
      'due_at', r.due_at,
      'case_payload', r.case_payload,
      'resolution', r.resolution,
      'resolved_at', r.resolved_at,
      'created_at', r.created_at
    ) x
    from church_intel.review_cases r
    where p_status is null or r.status = p_status
    order by r.created_at desc
    limit least(greatest(coalesce(p_limit,50),1),200)
  ) q
$$;

create function public.ci_list_sources(p_limit integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'display_name'), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', s.id,
      'source_key', s.source_key,
      'display_name', s.display_name,
      'independence_family_key', s.independence_family_key,
      'authority_class', s.authority_class,
      'access_method', s.access_method,
      'terms_url', s.terms_url,
      'license_name', s.license_name,
      'default_allowed_purposes', s.default_allowed_purposes,
      'automation_status', s.automation_status,
      'retention_rule', s.retention_rule,
      'policy_version', s.policy_version,
      'policy_effective_at', s.policy_effective_at,
      'notes', s.notes
    ) x
    from church_intel.source_registry s
    order by s.display_name
    limit least(greatest(coalesce(p_limit,100),1),200)
  ) q
$$;

create function public.ci_list_boundary_versions(p_limit integer default 50)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', b.id,
      'geo_place_id', b.geo_place_id,
      'geo_market_id', b.geo_market_id,
      'boundary_scope', b.boundary_scope,
      'version_label', b.version_label,
      'source_srid', b.source_srid,
      'normalized_srid', b.normalized_srid,
      'publication_status', b.publication_status,
      'effective_from', b.effective_from,
      'effective_to', b.effective_to,
      'published_at', b.published_at,
      'geometry_hash', b.geometry_hash,
      'created_at', b.created_at
    ) x
    from church_intel.geo_boundary_versions b
    order by b.created_at desc
    limit least(greatest(coalesce(p_limit,50),1),100)
  ) q
$$;

create function public.ci_list_system_links(p_organization_id uuid default null, p_limit integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', l.id,
      'organization_id', l.organization_id,
      'system_key', l.system_key,
      'faithbid_profile_id', l.faithbid_profile_id,
      'growth_church_id', l.growth_church_id,
      'concierge_organization_id', l.concierge_organization_id,
      'gpi_organization_id', l.gpi_organization_id,
      'link_status', l.link_status,
      'valid_from', l.valid_from,
      'valid_to', l.valid_to,
      'resolution_reason', l.resolution_reason,
      'created_at', l.created_at
    ) x
    from church_intel.church_system_links l
    where p_organization_id is null or l.organization_id = p_organization_id
    order by l.created_at desc
    limit least(greatest(coalesce(p_limit,100),1),200)
  ) q
$$;

grant church_intel_api_owner to postgres;

alter function public.ci_list_review_cases(text,integer) owner to church_intel_api_owner;
alter function public.ci_list_sources(integer) owner to church_intel_api_owner;
alter function public.ci_list_boundary_versions(integer) owner to church_intel_api_owner;
alter function public.ci_list_system_links(uuid,integer) owner to church_intel_api_owner;

revoke church_intel_api_owner from postgres;

revoke execute on function public.ci_list_review_cases(text,integer) from public, anon, service_role;
revoke execute on function public.ci_list_sources(integer) from public, anon, service_role;
revoke execute on function public.ci_list_boundary_versions(integer) from public, anon, service_role;
revoke execute on function public.ci_list_system_links(uuid,integer) from public, anon, service_role;

grant execute on function public.ci_list_review_cases(text,integer) to authenticated;
grant execute on function public.ci_list_sources(integer) to authenticated;
grant execute on function public.ci_list_boundary_versions(integer) to authenticated;
grant execute on function public.ci_list_system_links(uuid,integer) to authenticated;

comment on function public.ci_list_review_cases(text,integer) is 'Church Intelligence: admin-gated read of pending/resolved review cases for the Research Queue surface.';
comment on function public.ci_list_sources(integer) is 'Church Intelligence: admin-gated read of the source registry for the Sources surface.';
comment on function public.ci_list_boundary_versions(integer) is 'Church Intelligence: admin-gated read of geography boundary versions, excludes raw geometry payload.';
comment on function public.ci_list_system_links(uuid,integer) is 'Church Intelligence: admin-gated read of cross-system bridge links, optionally scoped to one organization.';
