revoke all on function public.gpi_service_search_public_opportunities_geo_v3(text[],uuid,text,text,text[],integer) from public, anon, authenticated;
grant execute on function public.gpi_service_search_public_opportunities_geo_v3(text[],uuid,text,text,text[],integer) to service_role;

revoke all on function public.kb_geo_search_places(text,integer) from public, anon, authenticated;
grant execute on function public.kb_geo_search_places(text,integer) to service_role;

alter function public.kb_marketplace_geo_fit(uuid,uuid) security invoker;
revoke all on function public.kb_marketplace_geo_fit(uuid,uuid) from public, anon, authenticated;
grant execute on function public.kb_marketplace_geo_fit(uuid,uuid) to service_role;

revoke all on function public.kb_marketplace_geo_fit_for_project(uuid) from public, anon;
grant execute on function public.kb_marketplace_geo_fit_for_project(uuid) to authenticated, service_role;

revoke all on function public.kb_vendor_sync_primary_service_radius(integer) from public, anon;
grant execute on function public.kb_vendor_sync_primary_service_radius(integer) to authenticated, service_role;
