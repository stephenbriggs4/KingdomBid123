-- R-29 follow-up: the sync trigger must also fire when the geo fields are set by
-- the BEFORE trigger (an UPDATE that only lists "city" in its SET clause).
drop trigger if exists vendors_sync_profile_location on public.vendors;
create trigger vendors_sync_profile_location
  after insert or update of city, service_city, service_state on public.vendors
  for each row execute function public.kb_vendor_sync_profile_location();

-- One-time sync for existing vendors.
update public.vendors set city = city where user_id is not null and service_city is not null and service_state is not null;
