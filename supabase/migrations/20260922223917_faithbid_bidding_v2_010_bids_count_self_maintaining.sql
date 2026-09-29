-- Fix: projects.bids_count has been stale since forever because the client
-- tried to update it directly after bid submission, and vendors don't have
-- UPDATE on projects under RLS, so the write silently fails (confirmed live
-- via QA bid 19cceebb-14ce-47bf-b1cf-7b2ac77e1ece: bids_count stayed 0 while
-- the real bid count was 1). Downstream, deriveCanonicalDealState() in the
-- frontend keys off project.bids_count to decide deal-room stage, so the
-- staleness surfaced as a real state bug (Deal Rooms conversation banner
-- stuck on "invited" language after a real proposal had been submitted,
-- reviewed, and declined). Root-fixing it here instead of patching every
-- client read site with a live count.

create or replace function private.faithbid_sync_project_bids_count_v1()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_project_id uuid;
begin
  if tg_op = 'DELETE' then
    v_project_id := old.project_id;
  else
    v_project_id := new.project_id;
  end if;

  update public.projects
  set bids_count = (select count(*) from public.bids where project_id = v_project_id)
  where id = v_project_id;

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    update public.projects
    set bids_count = (select count(*) from public.bids where project_id = old.project_id)
    where id = old.project_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists faithbid_bids_sync_project_bids_count_v1 on public.bids;
create trigger faithbid_bids_sync_project_bids_count_v1
after insert or update or delete on public.bids
for each row execute function private.faithbid_sync_project_bids_count_v1();

-- Backfill existing drift.
update public.projects p
set bids_count = coalesce(b.cnt, 0)
from (select project_id, count(*) as cnt from public.bids group by project_id) b
where p.id = b.project_id and p.bids_count is distinct from b.cnt;

update public.projects p
set bids_count = 0
where bids_count <> 0
  and not exists (select 1 from public.bids b where b.project_id = p.id);
