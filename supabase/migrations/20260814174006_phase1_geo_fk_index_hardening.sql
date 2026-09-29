create index if not exists geo_places_market_fk_idx
  on public.geo_places(market_id);

create index if not exists vendor_service_areas_vendor_fk_idx
  on public.vendor_service_areas(vendor_id);

create index if not exists vendor_service_areas_place_fk_idx
  on public.vendor_service_areas(place_id);

create index if not exists vendor_service_areas_market_fk_idx
  on public.vendor_service_areas(market_id);
