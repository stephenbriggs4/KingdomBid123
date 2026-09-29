-- projects.bids_count (fixed in migration 010) is a total-ever count, so a
-- project with one declined bid and zero live proposals still shows
-- "Review bid" on My Projects (confirmed live: [QA] Fellowship Hall Sound
-- System after decline). The card needs an ACTIONABLE count (pending +
-- under_review) to distinguish "something to decide on" from "history."

alter table public.projects
  add column if not exists actionable_bids_count integer not null default 0;

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
  set bids_count = (select count(*) from public.bids where project_id = v_project_id),
      actionable_bids_count = (select count(*) from public.bids where project_id = v_project_id and status in ('pending','under_review'))
  where id = v_project_id;

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    update public.projects
    set bids_count = (select count(*) from public.bids where project_id = old.project_id),
        actionable_bids_count = (select count(*) from public.bids where project_id = old.project_id and status in ('pending','under_review'))
    where id = old.project_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Backfill.
update public.projects p
set actionable_bids_count = coalesce(b.cnt, 0)
from (
  select project_id, count(*) as cnt
  from public.bids
  where status in ('pending','under_review')
  group by project_id
) b
where p.id = b.project_id and p.actionable_bids_count is distinct from b.cnt;

update public.projects p
set actionable_bids_count = 0
where actionable_bids_count <> 0
  and not exists (
    select 1 from public.bids b
    where b.project_id = p.id and b.status in ('pending','under_review')
  );
