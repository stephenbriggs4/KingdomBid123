revoke insert, truncate on table public.bids from anon, authenticated;
drop policy if exists "kb_bids_insert_vendor_open_project" on public.bids;
