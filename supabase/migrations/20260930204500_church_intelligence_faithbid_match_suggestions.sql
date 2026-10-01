-- Church Intelligence: suggest candidate FaithBid church-account matches for a canonical organization.
-- Read-only, admin-gated, narrow column grant + dedicated RLS policy on public.profiles for
-- church_intel_api_owner (role='church' rows only) -- same pattern already used for geo_places/geo_markets.
-- This does not create a duplicate CRM/account record: it only surfaces candidates for an admin to
-- confirm via the existing ci_set_system_link RPC. No automatic linking happens here.

create extension if not exists pg_trgm with schema extensions;

grant usage on schema extensions to church_intel_api_owner;
grant select(id, org_name, city, state_code, denomination, role) on public.profiles to church_intel_api_owner;

create policy profiles_ci_select on public.profiles for select to church_intel_api_owner
using (role = 'church');

create function public.ci_suggest_faithbid_matches(p_organization_id uuid, p_limit integer default 5)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare out_doc jsonb; v_org_name text; v_org_city text; v_org_region text;
begin
  perform church_intel.assert_admin();
  select o.canonical_name, s.locality, s.region_code
    into v_org_name, v_org_city, v_org_region
  from church_intel.church_organizations o
  left join church_intel.church_campuses c on c.organization_id = o.id and c.is_primary
  left join church_intel.campus_site_links l on l.campus_id = c.id and l.site_role = 'primary' and l.is_current
  left join church_intel.church_sites s on s.id = l.site_id
  where o.id = p_organization_id;

  if v_org_name is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into out_doc
  from (
    select jsonb_build_object(
      'profile_id', p.id,
      'org_name', p.org_name,
      'city', p.city,
      'state_code', p.state_code,
      'denomination', p.denomination,
      'name_similarity', round(extensions.similarity(coalesce(p.org_name,''), v_org_name)::numeric, 3),
      'city_match', (v_org_city is not null and p.city is not null and lower(p.city) = lower(v_org_city))
    ) x
    from public.profiles p
    where p.role = 'church'
      and (p.state_code is null or v_org_region is null or p.state_code = v_org_region)
      and extensions.similarity(coalesce(p.org_name,''), v_org_name) > 0.2
    order by extensions.similarity(coalesce(p.org_name,''), v_org_name) desc
    limit least(greatest(coalesce(p_limit,5),1),20)
  ) q;

  return out_doc;
end $$;

grant church_intel_api_owner to postgres;
grant create on schema public to church_intel_api_owner;
alter function public.ci_suggest_faithbid_matches(uuid,integer) owner to church_intel_api_owner;
revoke create on schema public from church_intel_api_owner;
revoke execute on function public.ci_suggest_faithbid_matches(uuid,integer) from public, anon, service_role;
grant execute on function public.ci_suggest_faithbid_matches(uuid,integer) to authenticated;
comment on function public.ci_suggest_faithbid_matches(uuid,integer) is 'Church Intelligence: admin-gated, read-only FaithBid church-account match suggestions by name similarity and city, for human-confirmed linking only.';
revoke church_intel_api_owner from postgres;
