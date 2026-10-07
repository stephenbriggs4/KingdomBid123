-- The production-aligned council-district overloads are owned by the migration role,
-- while church_intel.audit() is intentionally executable only by the locked
-- church_intel_api_owner role. Preserve the exact audit-log contract directly
-- instead of widening that helper's grants.

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
  actor := church_intel.platform_admin_actor();

  if requested_scope not in ('city','district') then
    raise exception using errcode='22023', message='Dallas boundary staging supports city or district scope';
  end if;
  if requested_scope='district' and (district_number is null or district_number not between 1 and 14) then
    raise exception using errcode='22023', message='council_district must be an integer from 1 through 14';
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
     or extensions.geometrytype(normalized)<>'MULTIPOLYGON' then
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

  insert into public.admin_audit_log(
    admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
  ) values (
    actor,'church_intel.boundary_staged','church_intel.geo_boundary_versions',bid::text,p_reason,null,
    jsonb_build_object('id',bid,'boundary_scope',requested_scope,'council_district',district_number,'geometry_hash',h),
    '{}'::jsonb
  );
  return bid;
end;
$function$;

create or replace function public.ci_publish_boundary(
  p_boundary_id uuid,
  p_reason text,
  p_council_district integer
)
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
  if not found or b.publication_status<>'draft' then
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
    and (b.boundary_scope<>'district' or v.transformation_metadata->>'council_district'=district_key);

  update church_intel.geo_boundary_versions
  set publication_status='published',published_at=now(),published_by=actor,effective_from=coalesce(effective_from,now())
  where id=p_boundary_id;

  insert into public.admin_audit_log(
    admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
  ) values (
    actor,'church_intel.boundary_published','church_intel.geo_boundary_versions',p_boundary_id::text,p_reason,null,
    jsonb_build_object('id',p_boundary_id,'boundary_scope',b.boundary_scope,'council_district',district_key,'geometry_hash',b.geometry_hash),
    '{}'::jsonb
  );
  return p_boundary_id;
end;
$function$;

revoke all on function public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text,text,integer) from public,anon,service_role;
grant execute on function public.ci_stage_dallas_boundary(uuid,text,text,jsonb,text,text,integer) to authenticated;
revoke all on function public.ci_publish_boundary(uuid,text,integer) from public,anon,service_role;
grant execute on function public.ci_publish_boundary(uuid,text,integer) to authenticated;
