-- Church Intelligence: directory usability pass (Phase 2/4 of the build-out).
-- 1. Resolves denomination from promoted, research-authorized evidence rather
--    than bypassing the locked purpose-scoped evidence model with a new column.
-- 2. Extends ci_list_organizations_overview with denomination, lat/long, and
--    the real Dallas boundary membership result (now that Phase 1 published it).
-- 3. Extends ci_list_review_cases and ci_list_system_links to resolve human-
--    readable names instead of raw UUIDs, including resolving a review case's
--    organization name through its site_id/campus_id when subject_organization_id
--    is null (ci_record_site_membership's auto-opened boundary cases key by site).

create or replace function public.ci_list_organizations_overview(p_limit integer default 200)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'canonical_name'), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', o.id,
      'canonical_name', o.canonical_name,
      'operating_state', o.operating_state,
      'denomination', (
        select c.asserted_value #>> '{}'
        from church_intel.evidence_claims c
        where c.organization_id = o.id
          and c.attribute_key = 'denomination'
          and c.claim_status = 'promoted'
          and 'research' = any(c.allowed_purposes)
          and 'research' = any(c.current_use_ceiling)
        order by c.promoted_at desc nulls last, c.created_at desc
        limit 1
      ),
      'address_line_1', s.address_line_1,
      'locality', s.locality,
      'region_code', s.region_code,
      'postal_code', s.postal_code,
      'latitude', s.latitude,
      'longitude', s.longitude,
      'dallas_membership', m.membership_result,
      'has_promoted_claim', exists(select 1 from church_intel.evidence_claims c where c.organization_id = o.id and c.claim_status = 'promoted'),
      'claim_count', (select count(*) from church_intel.evidence_claims c where c.organization_id = o.id),
      'open_review_case_count', (select count(*) from church_intel.review_cases r where r.subject_organization_id = o.id and r.status in ('open','in_progress')),
      'linked_to_faithbid', exists(select 1 from church_intel.church_system_links l2 where l2.organization_id = o.id and l2.system_key = 'faithbid_profile' and l2.link_status = 'active'),
      'link_status', (select l2.link_status from church_intel.church_system_links l2 where l2.organization_id = o.id and l2.system_key = 'faithbid_profile' order by (l2.link_status = 'active') desc, l2.created_at desc limit 1)
    ) x
    from church_intel.church_organizations o
    left join church_intel.church_campuses camp on camp.organization_id = o.id and camp.is_primary
    left join church_intel.campus_site_links l on l.campus_id = camp.id and l.site_role = 'primary' and l.is_current
    left join church_intel.church_sites s on s.id = l.site_id
    left join church_intel.site_geo_memberships m on m.site_id = s.id and m.is_current
    limit least(greatest(coalesce(p_limit,200),1),500)
  ) q
$$;

create or replace function public.ci_list_review_cases(p_status text default null, p_limit integer default 50)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', r.id,
      'case_type', r.case_type,
      'severity', r.severity,
      'status', r.status,
      'subject_organization_id', r.subject_organization_id,
      'subject_organization_name', coalesce(
        o_direct.canonical_name,
        (select o_site.canonical_name
         from church_intel.campus_site_links csl
         join church_intel.church_campuses c_site on c_site.id = csl.campus_id
         join church_intel.church_organizations o_site on o_site.id = c_site.organization_id
         where csl.site_id = r.subject_site_id and csl.is_current
         order by csl.created_at desc
         limit 1),
        o_via_campus.canonical_name
      ),
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
    left join church_intel.church_organizations o_direct on o_direct.id = r.subject_organization_id
    left join church_intel.church_campuses camp_direct on camp_direct.id = r.subject_campus_id
    left join church_intel.church_organizations o_via_campus on o_via_campus.id = camp_direct.organization_id
    where p_status is null or r.status = p_status
    order by r.created_at desc
    limit least(greatest(coalesce(p_limit,50),1),200)
  ) q
$$;

create or replace function public.ci_list_system_links(p_organization_id uuid default null, p_limit integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when church_intel.assert_admin() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id', l.id,
      'organization_id', l.organization_id,
      'organization_name', o.canonical_name,
      'system_key', l.system_key,
      'faithbid_profile_id', l.faithbid_profile_id,
      'faithbid_org_name', p.org_name,
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
    left join church_intel.church_organizations o on o.id = l.organization_id
    left join public.profiles p on p.id = l.faithbid_profile_id
    where p_organization_id is null or l.organization_id = p_organization_id
    order by l.created_at desc
    limit least(greatest(coalesce(p_limit,100),1),200)
  ) q
$$;

grant church_intel_api_owner to postgres;
alter function public.ci_list_organizations_overview(integer) owner to church_intel_api_owner;
alter function public.ci_list_review_cases(text,integer) owner to church_intel_api_owner;
alter function public.ci_list_system_links(uuid,integer) owner to church_intel_api_owner;
revoke church_intel_api_owner from postgres;

revoke execute on function public.ci_list_organizations_overview(integer) from public, anon, service_role;
grant execute on function public.ci_list_organizations_overview(integer) to authenticated;

comment on function public.ci_list_organizations_overview(integer) is 'Church Intelligence: admin-gated Dallas directory overview; denomination is returned only from promoted research-authorized evidence.';
