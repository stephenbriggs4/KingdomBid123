grant select on public.geo_markets to anon, authenticated;
grant select on public.geo_places to anon, authenticated;

drop policy if exists geo_markets_public_active_select on public.geo_markets;
create policy geo_markets_public_active_select
on public.geo_markets for select
to anon, authenticated
using (active);

drop policy if exists geo_places_public_active_select on public.geo_places;
create policy geo_places_public_active_select
on public.geo_places for select
to anon, authenticated
using (active);
