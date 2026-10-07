-- Church Intelligence: City of Dallas council-district geography (production-aligned migration).
--
-- The original table used text for boundary_scope but also carried two
-- CHECK constraints and one current-publication index that only modeled a
-- single city/county boundary per place. Districts therefore need no new
-- table or column, but they do need the existing constraints and publication
-- identity corrected so 14 independently versioned districts can coexist.

alter table church_intel.geo_boundary_versions
  drop constraint ci_boundary_scope_ck,
  drop constraint ci_boundary_owner_scope_ck;

alter table church_intel.geo_boundary_versions
  add constraint ci_boundary_scope_ck
    check (boundary_scope in ('city','county','metro','district')),
  add constraint ci_boundary_owner_scope_ck
    check (
      (boundary_scope in ('city','county','district') and geo_place_id is not null and geo_market_id is null)
      or (boundary_scope = 'metro' and geo_market_id is not null and geo_place_id is null)
    ),
  add constraint ci_boundary_district_metadata_ck
    check (
      boundary_scope <> 'district'
      or (
        transformation_metadata ? 'council_district'
        and (transformation_metadata->>'council_district') ~ '^([1-9]|1[0-4])$'
      )
    );

drop index church_intel.ci_boundary_published_place_uq;
create unique index ci_boundary_published_place_uq
  on church_intel.geo_boundary_versions(
    geo_place_id,
    boundary_scope,
    (case when boundary_scope = 'district' then transformation_metadata->>'council_district' else '' end)
  )
  where publication_status = 'published'
    and effective_to is null
    and geo_place_id is not null;

-- The production runner is a NOINHERIT member of the locked RPC owner.
-- Assume that role only while replacing the two existing owner-bound RPCs.
create or replace function public.ci_stage_dallas_boundary(
  p_source_record_id uuid,
  p_native_wkt text,
  p_version_label text,
  p_transformation_metadata jsonb,
  p_reason text,
  p_boundary_scope text,
  p_council_district integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid;
  place_id uuid;
  native_geom extensions.geometry;
  normalized extensions.geometry;
  bid uuid;
  h text;
  requested_scope text := coalesce(nullif(p_boundary_scope,''), 'city');
  district_number integer := p_council_district;
begin
  -- The locked five-argument original is owned by church_intel_api_owner,
  -- which the production migration runner cannot assume. This compatible
  -- overload uses the required direct platform-admin gate.
  actor := church_intel.platform_admin_actor();

  if requested_scope not in ('city','district') then
    raise exception using errcode='22023', message='Dallas boundary staging supports city or district scope';
  end if;

  if requested_scope = 'district' then
    if district_number is null or district_number not between 1 and 14 then
      raise exception using errcode='22023', message='council_district must be an integer from 1 through 14';
    end if;
  end if;

  select id into place_id
  from public.geo_places
  where slug='dallas-tx' and city='Dallas' and state_code='TX' and active;
  if place_id is null then raise exception 'active Dallas geo_place not found'; end if;

  native_geom := extensions.st_setsrid(extensions.st_geomfromtext(p_native_wkt),2276);
  normalized := extensions.st_multi(extensions.st_normalize(extensions.st_forcerhr(
    extensions.st_unaryunion(extensions.st_collectionextract(extensions.st_makevalid(
      extensions.st_removerepeatedpoints(extensions.st_snaptogrid(extensions.st_transform(
        extensions.st_unaryunion(extensions.st_collectionextract(extensions.st_makevalid(native_geom),3)),
        4326
      ),0.00000001))
    ),3))
  )));

  if extensions.st_isempty(normalized)
     or not extensions.st_isvalid(normalized)
     or extensions.geometrytype(normalized) <> 'MULTIPOLYGON' then
    raise exception using errcode='22023', message='normalized Dallas boundary is invalid';
  end if;

  h := encode(extensions.digest(extensions.st_asewkb(normalized,'NDR'),'sha256'),'hex');
  insert into church_intel.geo_boundary_versions(
    geo_place_id,boundary_scope,source_record_id,version_label,source_srid,
    normalization_procedure_version,transformation_metadata,boundary,
    geometry_hash,publication_status,created_by
  ) values (
    place_id,requested_scope,p_source_record_id,p_version_label,2276,
    'dallas_boundary_norm_v1',
    p_transformation_metadata || jsonb_build_object(
      'boundary_scope',requested_scope,
      'council_district',district_number,
      'normalized_hash',h,
      'source_srid',2276,
      'normalized_srid',4326,
      'ewkb_endian','NDR'
    ),
    normalized,h,'draft',actor
  ) returning id into bid;

  perform church_intel.audit(
    'church_intel.boundary_staged','church_intel.geo_boundary_versions',bid::text,p_reason,null,
    jsonb_build_object('id',bid,'boundary_scope',requested_scope,'council_district',district_number,'geometry_hash',h)
  );
  return bid;
end;
$function$;

create or replace function public.ci_publish_boundary(p_boundary_id uuid,p_reason text,p_council_district integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid;
  b church_intel.geo_boundary_versions%rowtype;
  district_key text;
begin
  actor := church_intel.platform_admin_actor();
  select * into b from church_intel.geo_boundary_versions where id=p_boundary_id for update;
  if not found or b.publication_status <> 'draft' then
    raise exception using errcode='55000',message='only a draft boundary can be published';
  end if;

  district_key := case when b.boundary_scope='district' then b.transformation_metadata->>'council_district' else null end;
  if b.boundary_scope='district' and district_key is distinct from p_council_district::text then
    raise exception using errcode='22023',message='published council district does not match the staged boundary';
  end if;
  update church_intel.geo_boundary_versions v
  set publication_status='superseded',effective_to=now()
  where v.publication_status='published'
    and v.effective_to is null
    and v.geo_place_id is not distinct from b.geo_place_id
    and v.geo_market_id is not distinct from b.geo_market_id
    and v.boundary_scope=b.boundary_scope
    and (
      b.boundary_scope <> 'district'
      or v.transformation_metadata->>'council_district' = district_key
    );

  update church_intel.geo_boundary_versions
  set publication_status='published',published_at=now(),published_by=actor,effective_from=coalesce(effective_from,now())
  where id=p_boundary_id;

  perform church_intel.audit(
    'church_intel.boundary_published','church_intel.geo_boundary_versions',p_boundary_id::text,p_reason,null,
    jsonb_build_object('id',p_boundary_id,'boundary_scope',b.boundary_scope,'council_district',district_key,'geometry_hash',b.geometry_hash)
  );
  return p_boundary_id;
end;
$function$;

-- Keep the existing RPC surface, but let the district scope return all 14
-- current polygons as one GeoJSON FeatureCollection. COUNCILPER is omitted:
-- it is an officeholder snapshot, not a stable district fact.
create or replace function public.ci_get_boundary_geojson(p_scope text default 'city')
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select case when church_intel.platform_admin_actor() is null then null else
    case when p_scope = 'district' then (
      select jsonb_build_object(
        'boundary_scope','district',
        'geometry',jsonb_build_object(
          'type','FeatureCollection',
          'features',coalesce(jsonb_agg(
            jsonb_build_object(
              'type','Feature',
              'properties',jsonb_build_object(
                'council_district',(v.transformation_metadata->>'council_district')::integer,
                'version_label',v.version_label
              ),
              'geometry',extensions.st_asgeojson(extensions.st_simplifypreservetopology(v.boundary,0.0003))::jsonb
            ) order by (v.transformation_metadata->>'council_district')::integer
          ),'[]'::jsonb)
        )
      )
      from church_intel.geo_boundary_versions v
      where v.boundary_scope='district'
        and v.publication_status='published'
        and v.effective_to is null
    ) else (
      select jsonb_build_object(
        'id',v.id,
        'version_label',v.version_label,
        'boundary_scope',v.boundary_scope,
        'geometry',extensions.st_asgeojson(extensions.st_simplifypreservetopology(v.boundary,0.0003))::jsonb
      )
      from church_intel.geo_boundary_versions v
      where v.boundary_scope=p_scope
        and v.publication_status='published'
        and v.effective_to is null
      order by v.effective_from desc nulls last,v.created_at desc
      limit 1
    ) end
  end;
$function$;

create or replace function public.ci_list_organizations_overview(p_limit integer,p_include_council_district boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select case when church_intel.platform_admin_actor() is null then '[]'::jsonb else coalesce(jsonb_agg(x order by x->>'canonical_name'), '[]'::jsonb) end
  from (
    select jsonb_build_object(
      'id',o.id,
      'canonical_name',o.canonical_name,
      'operating_state',o.operating_state,
      'denomination',(
        select c.asserted_value #>> '{}'
        from church_intel.evidence_claims c
        where c.organization_id=o.id
          and c.attribute_key='denomination'
          and c.claim_status='promoted'
          and 'research'=any(c.allowed_purposes)
          and 'research'=any(c.current_use_ceiling)
        order by c.promoted_at desc nulls last,c.created_at desc
        limit 1
      ),
      'address_line_1',s.address_line_1,
      'locality',s.locality,
      'region_code',s.region_code,
      'postal_code',s.postal_code,
      'latitude',s.latitude,
      'longitude',s.longitude,
      'dallas_membership',m.membership_result,
      'council_district',case when p_include_council_district then (
        select (v.transformation_metadata->>'council_district')::integer
        from church_intel.geo_boundary_versions v
        where v.boundary_scope='district'
          and v.publication_status='published'
          and v.effective_to is null
          and s.longitude is not null
          and s.latitude is not null
          and extensions.st_contains(
            v.boundary,
            extensions.st_setsrid(extensions.st_makepoint(s.longitude::double precision,s.latitude::double precision),4326)
          )
        order by (v.transformation_metadata->>'council_district')::integer
        limit 1
      ) else null end,
      'has_promoted_claim',exists(select 1 from church_intel.evidence_claims c where c.organization_id=o.id and c.claim_status='promoted'),
      'claim_count',(select count(*) from church_intel.evidence_claims c where c.organization_id=o.id),
      'open_review_case_count',(select count(*) from church_intel.review_cases r where r.subject_organization_id=o.id and r.status in ('open','in_progress')),
      'linked_to_faithbid',exists(select 1 from church_intel.church_system_links l2 where l2.organization_id=o.id and l2.system_key='faithbid_profile' and l2.link_status='active'),
      'link_status',(select l2.link_status from church_intel.church_system_links l2 where l2.organization_id=o.id and l2.system_key='faithbid_profile' order by (l2.link_status='active') desc,l2.created_at desc limit 1)
    ) x
    from church_intel.church_organizations o
    left join church_intel.church_campuses camp on camp.organization_id=o.id and camp.is_primary
    left join church_intel.campus_site_links l on l.campus_id=camp.id and l.site_role='primary' and l.is_current
    left join church_intel.church_sites s on s.id=l.site_id
    left join church_intel.site_geo_memberships m on m.site_id=s.id and m.is_current
    limit least(greatest(coalesce(p_limit,200),1),500)
  ) q;
$function$;

revoke all on function public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text,text,integer) from public, anon, service_role;
grant execute on function public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text,text,integer) to authenticated;
revoke all on function public.ci_publish_boundary(uuid,text,integer) from public, anon, service_role;
grant execute on function public.ci_publish_boundary(uuid,text,integer) to authenticated;
revoke all on function public.ci_list_organizations_overview(integer,boolean) from public, anon, service_role;
grant execute on function public.ci_list_organizations_overview(integer,boolean) to authenticated;

comment on function public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text,text,integer) is
  'Church Intelligence: admin-gated staging for authoritative Dallas city or council-district boundaries in native EPSG:2276.';
comment on function public.ci_publish_boundary(uuid,text,integer) is
  'Church Intelligence: publishes one immutable boundary version; council districts supersede only the same district number.';
comment on function public.ci_list_organizations_overview(integer,boolean) is
  'Church Intelligence: admin-gated Dallas directory overview with purpose-scoped denomination and server-computed council district.';

revoke all on function public.ci_get_boundary_geojson(text) from public, anon, service_role;
grant execute on function public.ci_get_boundary_geojson(text) to authenticated;
comment on function public.ci_get_boundary_geojson(text) is
  'Church Intelligence: returns current published city geometry or all 14 current district geometries as simplified GeoJSON.';
