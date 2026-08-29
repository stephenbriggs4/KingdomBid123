-- Match snapshots are historical evidence of what the ranking engine showed.
-- The client only inserts and reads them; post-creation mutation is not legitimate.
drop policy if exists match_snapshots_update_creator_or_church on public.match_snapshots;

revoke update, delete, truncate on table public.match_snapshots from authenticated;
revoke truncate on table public.match_snapshots from anon;
