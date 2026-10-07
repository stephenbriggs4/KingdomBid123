-- Church Intelligence: a read-only RPC returning the current published
-- boundary for a given scope as simplified GeoJSON, for map display.
--
-- Built generic (p_scope, default 'city') so a future 'district' scope
-- needs zero migration -- geo_boundary_versions.boundary_scope already
-- allows arbitrary text. The raw city boundary is 13,415 points / 359KB of
-- GeoJSON (checked directly); ST_SimplifyPreserveTopology at tolerance
-- 0.0003 brings that to ~43KB while staying visually accurate at city
-- scale, which is all a browser map needs. The full-precision boundary
-- remains in geo_boundary_versions.boundary for server-side membership
-- checks (ci_record_site_membership); this RPC never touches that path.
create or replace function public.ci_get_boundary_geojson(p_scope text default 'city')
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  -- Calls church_intel.platform_admin_actor() directly rather than the thin
  -- church_intel.assert_admin() wrapper: assert_admin's own grants are
  -- deliberately restricted to church_intel_api_owner only (a NOLOGIN,
  -- NOINHERIT role nothing else can assume, by design), while this function
  -- is owned by the migration-applying role. platform_admin_actor() is the
  -- actual check assert_admin merely wraps, and it already grants execute
  -- to that owner -- same security check, no grant was loosened.
  select case when church_intel.platform_admin_actor() is null then null else
    (
      select jsonb_build_object(
        'id', v.id,
        'version_label', v.version_label,
        'boundary_scope', v.boundary_scope,
        'geometry', extensions.st_asgeojson(extensions.st_simplifypreservetopology(v.boundary, 0.0003))::jsonb
      )
      from church_intel.geo_boundary_versions v
      where v.boundary_scope = p_scope
        and v.publication_status = 'published'
        and v.effective_to is null
      order by v.effective_from desc nulls last, v.created_at desc
      limit 1
    )
  end;
$function$;

revoke all on function public.ci_get_boundary_geojson(text) from public, anon;
grant execute on function public.ci_get_boundary_geojson(text) to authenticated;
