-- ============================================================================
-- FaithBid Bidding v2
-- Migration 001: Integrity Boundary
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- PURPOSE
--   Harden project<->church and vendor-profile<->vendor-user identity
--   relationships before any new bidding frontend is built.
--
-- IMPORTANT
--   This file has NOT been applied to Supabase.
--   It intentionally does NOT enable marketplace_public or bidding_enabled.
--   It intentionally does NOT modify App.jsx.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';

-- ============================================================================
-- 0. PRE-APPLY ASSERTIONS
-- Fail closed if live data has drifted since the 2026-09-22 audit.
-- ============================================================================

do $$
begin
  if exists (
    select 1
    from public.projects p
    where p.church_id is null
  ) then
    raise exception
      'Migration 001 preflight failed: projects.church_id contains NULL values';
  end if;

  if exists (
    select 1
    from public.project_vendor_links l
    join public.projects p on p.id = l.project_id
    where l.church_id is distinct from p.church_id
  ) then
    raise exception
      'Migration 001 preflight failed: project_vendor_links contains project/church mismatches';
  end if;

  if exists (
    select 1
    from public.project_vendor_links l
    left join public.vendors v on v.id = l.vendor_id
    where l.vendor_id is not null
      and (
        v.id is null
        or v.user_id is distinct from l.vendor_user_id
      )
  ) then
    raise exception
      'Migration 001 preflight failed: project_vendor_links contains vendor identity mismatches';
  end if;

  if exists (
    select 1
    from public.project_vendor_links l
    where l.source not in (
      'marketplace',
      'directory',
      'compare',
      'manual',
      'detail',
      'inbox',
      'profile',
      'bid-review',
      'project-detail'
    )
  ) then
    raise exception
      'Migration 001 preflight failed: project_vendor_links contains an unknown source value';
  end if;

  if exists (
    select 1
    from public.vendor_invites i
    join public.projects p on p.id = i.project_id
    where i.church_id is distinct from p.church_id
  ) then
    raise exception
      'Migration 001 preflight failed: vendor_invites contains project/church mismatches';
  end if;

  if exists (
    select 1
    from public.vendor_invites i
    left join public.vendors v on v.id = i.vendor_id
    where v.id is null
      or (
        i.vendor_user_id is not null
        and v.user_id is distinct from i.vendor_user_id
      )
  ) then
    raise exception
      'Migration 001 preflight failed: vendor_invites contains vendor identity mismatches';
  end if;

  if exists (
    select 1
    from public.match_snapshots s
    join public.projects p on p.id = s.project_id
    where s.church_id is distinct from p.church_id
  ) then
    raise exception
      'Migration 001 preflight failed: match_snapshots contains project/church mismatches';
  end if;

  if exists (
    select 1
    from public.match_snapshots s
    left join public.vendors v on v.id = s.vendor_id
    where v.id is null
      or (
        s.vendor_user_id is not null
        and v.user_id is distinct from s.vendor_user_id
      )
  ) then
    raise exception
      'Migration 001 preflight failed: match_snapshots contains vendor identity mismatches';
  end if;

  if exists (
    select 1
    from public.bids b
    left join public.projects p on p.id = b.project_id
    where b.project_id is null
       or p.id is null
       or (
         b.church_id is not null
         and b.church_id is distinct from p.church_id
       )
       or (
         b.vendor_id is not null
         and b.vendor_user_id is not null
         and b.vendor_id is distinct from b.vendor_user_id
       )
  ) then
    raise exception
      'Migration 001 preflight failed: bids contains project/church or vendor-user identity mismatches';
  end if;
end
$$;


-- ============================================================================
-- 1. PARENT COMPOSITE IDENTITY KEYS
-- These keys let child rows prove identity pairs at the database level.
-- ============================================================================

alter table public.projects
  add constraint projects_id_church_id_key
  unique (id, church_id);

alter table public.vendors
  add constraint vendors_id_user_id_key
  unique (id, user_id);


-- ============================================================================
-- 2. PROJECT_VENDOR_LINKS: RELATIONAL INTEGRITY
-- Keep vendor_id nullable because its existing FK intentionally uses
-- ON DELETE SET NULL. New browser writes are still required by RLS to supply
-- a valid vendor profile/user pair.
-- ============================================================================

alter table public.project_vendor_links
  add constraint project_vendor_links_project_church_fkey
  foreign key (project_id, church_id)
  references public.projects (id, church_id)
  on delete cascade;

alter table public.project_vendor_links
  add constraint project_vendor_links_vendor_pair_fkey
  foreign key (vendor_id, vendor_user_id)
  references public.vendors (id, user_id);

alter table public.project_vendor_links
  drop constraint project_vendor_links_source_check;

alter table public.project_vendor_links
  add constraint project_vendor_links_source_check
  check (
    source = any (
      array[
        'marketplace'::text,
        'directory'::text,
        'compare'::text,
        'manual'::text,
        'detail'::text,
        'inbox'::text,

        -- Temporary legacy compatibility values emitted by hidden 0008 App.jsx.
        -- V2 commands should normalize new writes to the canonical set above.
        'profile'::text,
        'bid-review'::text,
        'project-detail'::text
      ]
    )
  );

create index if not exists project_vendor_links_vendor_pair_idx
  on public.project_vendor_links (vendor_id, vendor_user_id);

-- Remove the duplicate updated_at trigger. Both existing trigger functions
-- perform the same assignment: NEW.updated_at = now().
drop trigger if exists trg_project_vendor_links_updated_at
  on public.project_vendor_links;


-- ============================================================================
-- 3. PROJECT_VENDOR_LINKS: IMMUTABLE IDENTITY + HARDENED RLS
-- ============================================================================

create or replace function private.kb_guard_project_vendor_link_identity_v1()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user in ('service_role', 'postgres')
     or coalesce(public.kb_is_platform_admin(), false) then
    return new;
  end if;

  if new.project_id is distinct from old.project_id
     or new.church_id is distinct from old.church_id
     or new.vendor_id is distinct from old.vendor_id
     or new.vendor_user_id is distinct from old.vendor_user_id then
    raise exception
      'Project/vendor relationship identity fields are immutable'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke all on function private.kb_guard_project_vendor_link_identity_v1()
  from public, anon, authenticated;

drop trigger if exists kb_project_vendor_links_identity_guard_v1
  on public.project_vendor_links;

create trigger kb_project_vendor_links_identity_guard_v1
before update on public.project_vendor_links
for each row
execute function private.kb_guard_project_vendor_link_identity_v1();

drop policy if exists kb_project_vendor_links_insert_church
  on public.project_vendor_links;
drop policy if exists kb_project_vendor_links_update_church
  on public.project_vendor_links;
drop policy if exists kb_project_vendor_links_delete_church
  on public.project_vendor_links;

create policy kb_project_vendor_links_insert_church_v2
on public.project_vendor_links
for insert
to authenticated
with check (
  public.kb_is_platform_admin()
  or (
    project_vendor_links.church_id = (select auth.uid())
    and project_vendor_links.vendor_id is not null
    and exists (
      select 1
      from public.projects p
      where p.id = project_vendor_links.project_id
        and p.church_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.vendors v
      where v.id = project_vendor_links.vendor_id
        and v.user_id = project_vendor_links.vendor_user_id
    )
  )
);

create policy kb_project_vendor_links_update_church_v2
on public.project_vendor_links
for update
to authenticated
using (
  public.kb_is_platform_admin()
  or (
    project_vendor_links.church_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      where p.id = project_vendor_links.project_id
        and p.church_id = (select auth.uid())
    )
  )
)
with check (
  public.kb_is_platform_admin()
  or (
    project_vendor_links.church_id = (select auth.uid())
    and project_vendor_links.vendor_id is not null
    and exists (
      select 1
      from public.projects p
      where p.id = project_vendor_links.project_id
        and p.church_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.vendors v
      where v.id = project_vendor_links.vendor_id
        and v.user_id = project_vendor_links.vendor_user_id
    )
  )
);

create policy kb_project_vendor_links_delete_church_v2
on public.project_vendor_links
for delete
to authenticated
using (
  public.kb_is_platform_admin()
  or (
    project_vendor_links.church_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      where p.id = project_vendor_links.project_id
        and p.church_id = (select auth.uid())
    )
  )
);

-- No anonymous surface is required for project/vendor relationship rows.
revoke all on table public.project_vendor_links from anon;


-- ============================================================================
-- 4. MATCH_SNAPSHOTS: PROJECT/VENDOR IDENTITY INTEGRITY
-- ============================================================================

alter table public.match_snapshots
  add constraint match_snapshots_project_church_fkey
  foreign key (project_id, church_id)
  references public.projects (id, church_id)
  on delete cascade;

alter table public.match_snapshots
  add constraint match_snapshots_vendor_id_fkey
  foreign key (vendor_id)
  references public.vendors (id)
  on delete cascade;

alter table public.match_snapshots
  add constraint match_snapshots_vendor_user_id_fkey
  foreign key (vendor_user_id)
  references auth.users (id)
  on delete set null;

alter table public.match_snapshots
  add constraint match_snapshots_vendor_pair_fkey
  foreign key (vendor_id, vendor_user_id)
  references public.vendors (id, user_id);

drop policy if exists match_snapshots_insert_own_church
  on public.match_snapshots;

create policy match_snapshots_insert_own_church_v2
on public.match_snapshots
for insert
to authenticated
with check (
  match_snapshots.created_by = (select auth.uid())
  and match_snapshots.church_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = match_snapshots.project_id
      and p.church_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.vendors v
    where v.id = match_snapshots.vendor_id
      and (
        match_snapshots.vendor_user_id is null
        or v.user_id = match_snapshots.vendor_user_id
      )
  )
);


-- ============================================================================
-- 5. VENDOR_INVITES: CANONICAL PROFILE/USER IDENTITY + OPTIONAL SNAPSHOT
-- Manual/direct invitations are valid without fabricating a recommendation
-- snapshot. Recommended-vendor invitations can still attach a snapshot.
-- ============================================================================

alter table public.vendor_invites
  alter column match_snapshot_id drop not null;

-- The live table currently has zero rows. If rows appear before this migration
-- is applied, fail rather than invent vendor_user_id values.
do $$
begin
  if exists (
    select 1
    from public.vendor_invites
    where vendor_user_id is null
  ) then
    raise exception
      'Migration 001 preflight failed: vendor_invites.vendor_user_id contains NULL values';
  end if;
end
$$;

alter table public.vendor_invites
  alter column vendor_user_id set not null;

alter table public.vendor_invites
  add constraint vendor_invites_project_church_fkey
  foreign key (project_id, church_id)
  references public.projects (id, church_id)
  on delete cascade;

alter table public.vendor_invites
  add constraint vendor_invites_vendor_id_fkey
  foreign key (vendor_id)
  references public.vendors (id)
  on delete cascade;

alter table public.vendor_invites
  add constraint vendor_invites_vendor_user_id_fkey
  foreign key (vendor_user_id)
  references auth.users (id)
  on delete cascade;

alter table public.vendor_invites
  add constraint vendor_invites_vendor_pair_fkey
  foreign key (vendor_id, vendor_user_id)
  references public.vendors (id, user_id);

alter table public.vendor_invites
  add constraint vendor_invites_bid_id_fkey
  foreign key (bid_id)
  references public.bids (id)
  on delete set null;

create index if not exists vendor_invites_vendor_pair_idx
  on public.vendor_invites (vendor_id, vendor_user_id);

create index if not exists vendor_invites_bid_id_idx
  on public.vendor_invites (bid_id)
  where bid_id is not null;


-- ============================================================================
-- 6. VENDOR_INVITES: IMMUTABLE IDENTITY + HARDENED RLS
-- ============================================================================

create or replace function private.kb_guard_vendor_invite_identity_v1()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user in ('service_role', 'postgres')
     or coalesce(public.kb_is_platform_admin(), false) then
    return new;
  end if;

  if new.project_id is distinct from old.project_id
     or new.church_id is distinct from old.church_id
     or new.vendor_id is distinct from old.vendor_id
     or new.vendor_user_id is distinct from old.vendor_user_id
     or new.match_snapshot_id is distinct from old.match_snapshot_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception
      'Vendor invitation identity fields are immutable'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke all on function private.kb_guard_vendor_invite_identity_v1()
  from public, anon, authenticated;

drop trigger if exists kb_vendor_invites_identity_guard_v1
  on public.vendor_invites;

create trigger kb_vendor_invites_identity_guard_v1
before update on public.vendor_invites
for each row
execute function private.kb_guard_vendor_invite_identity_v1();

drop policy if exists vendor_invites_insert_own_church_with_snapshot
  on public.vendor_invites;
drop policy if exists vendor_invites_update_own_church
  on public.vendor_invites;

create policy vendor_invites_insert_own_church_v2
on public.vendor_invites
for insert
to authenticated
with check (
  vendor_invites.created_by = (select auth.uid())
  and vendor_invites.church_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = vendor_invites.project_id
      and p.church_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.vendors v
    where v.id = vendor_invites.vendor_id
      and v.user_id = vendor_invites.vendor_user_id
  )
  and (
    vendor_invites.match_snapshot_id is null
    or exists (
      select 1
      from public.match_snapshots ms
      where ms.id = vendor_invites.match_snapshot_id
        and ms.project_id = vendor_invites.project_id
        and ms.church_id = vendor_invites.church_id
        and ms.vendor_id = vendor_invites.vendor_id
        and (
          ms.vendor_user_id is null
          or ms.vendor_user_id = vendor_invites.vendor_user_id
        )
    )
  )
);

create policy vendor_invites_update_own_church_v2
on public.vendor_invites
for update
to authenticated
using (
  vendor_invites.church_id = (select auth.uid())
  and vendor_invites.created_by = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = vendor_invites.project_id
      and p.church_id = (select auth.uid())
  )
)
with check (
  vendor_invites.church_id = (select auth.uid())
  and vendor_invites.created_by = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = vendor_invites.project_id
      and p.church_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.vendors v
    where v.id = vendor_invites.vendor_id
      and v.user_id = vendor_invites.vendor_user_id
  )
  and (
    vendor_invites.match_snapshot_id is null
    or exists (
      select 1
      from public.match_snapshots ms
      where ms.id = vendor_invites.match_snapshot_id
        and ms.project_id = vendor_invites.project_id
        and ms.church_id = vendor_invites.church_id
        and ms.vendor_id = vendor_invites.vendor_id
        and (
          ms.vendor_user_id is null
          or ms.vendor_user_id = vendor_invites.vendor_user_id
        )
    )
  )
);


-- ============================================================================
-- 7. BIDS: SCHEMA-LEVEL INTEGRITY
-- The live database currently contains zero bid rows, making this the safest
-- point to establish the contract before the redesigned frontend exists.
-- ============================================================================

alter table public.bids
  add column updated_at timestamptz not null default now(),
  add column reviewed_at timestamptz,
  add column declined_at timestamptz,
  add column hired_at timestamptz;

alter table public.bids
  alter column cover_letter set default '',
  alter column milestones set default '[]'::jsonb,
  alter column submitted_at set default now();

-- Safe compatibility backfills if a legacy row appears between audit and apply.
update public.bids b
set church_id = p.church_id
from public.projects p
where b.project_id = p.id
  and b.church_id is null;

update public.bids
set vendor_user_id = vendor_id
where vendor_user_id is null
  and vendor_id is not null;

update public.bids
set cover_letter = ''
where cover_letter is null;

update public.bids
set milestones = '[]'::jsonb
where milestones is null;

update public.bids
set status = 'pending'
where status is null;

update public.bids
set created_at = now()
where created_at is null;

update public.bids
set submitted_at = coalesce(created_at, now())
where submitted_at is null;

do $$
begin
  if exists (
    select 1
    from public.bids b
    left join public.projects p on p.id = b.project_id
    where b.project_id is null
       or p.id is null
       or b.vendor_id is null
       or b.vendor_user_id is null
       or b.vendor_id is distinct from b.vendor_user_id
       or b.church_id is null
       or b.church_id is distinct from p.church_id
       or b.amount is null
       or b.amount <= 0
       or b.amount > 10000000
       or b.amount <> round(b.amount, 2)
       or nullif(btrim(b.timeline), '') is null
       or char_length(btrim(b.timeline)) > 200
       or char_length(coalesce(b.cover_letter, '')) > 1500
       or b.milestones is null
       or jsonb_typeof(b.milestones) <> 'array'
       or jsonb_array_length(b.milestones) > 25
       or octet_length(b.milestones::text) > 50000
       or b.status not in (
         'pending',
         'under_review',
         'withdrawn',
         'declined',
         'hired'
       )
       or b.created_at is null
       or b.submitted_at is null
  ) then
    raise exception
      'Migration 001 preflight failed: bids contains rows incompatible with the v2 integrity contract';
  end if;
end
$$;

alter table public.bids
  alter column project_id set not null,
  alter column vendor_id set not null,
  alter column amount set not null,
  alter column timeline set not null,
  alter column cover_letter set not null,
  alter column milestones set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column church_id set not null,
  alter column submitted_at set not null,
  alter column vendor_user_id set not null;

alter table public.bids
  add constraint bids_church_id_fkey
  foreign key (church_id)
  references auth.users (id);

alter table public.bids
  add constraint bids_vendor_user_id_fkey
  foreign key (vendor_user_id)
  references auth.users (id);

alter table public.bids
  add constraint bids_project_church_fkey
  foreign key (project_id, church_id)
  references public.projects (id, church_id)
  on delete cascade;

alter table public.bids
  add constraint bids_vendor_identity_check
  check (vendor_user_id = vendor_id);

alter table public.bids
  add constraint bids_status_check
  check (
    status = any (
      array[
        'pending'::text,
        'under_review'::text,
        'withdrawn'::text,
        'declined'::text,
        'hired'::text
      ]
    )
  );

alter table public.bids
  add constraint bids_amount_contract_check
  check (
    amount > 0
    and amount <= 10000000
    and amount = round(amount, 2)
  );

alter table public.bids
  add constraint bids_timeline_contract_check
  check (
    char_length(btrim(timeline)) between 1 and 200
  );

alter table public.bids
  add constraint bids_cover_letter_contract_check
  check (
    char_length(cover_letter) <= 1500
  );

alter table public.bids
  add constraint bids_milestones_contract_check
  check (
    jsonb_typeof(milestones) = 'array'
    and jsonb_array_length(milestones) <= 25
    and octet_length(milestones::text) <= 50000
  );

drop trigger if exists trg_bids_touch_updated_at
  on public.bids;

create trigger trg_bids_touch_updated_at
before update on public.bids
for each row
execute function public.kb_set_updated_at();


-- ============================================================================
-- 8. PROJECT ACTIVITY VOCABULARY
-- Add explicit negative/exit bid events required by the future atomic commands.
-- ============================================================================

alter table public.project_activity_feed
  drop constraint project_activity_feed_kind_check;

alter table public.project_activity_feed
  add constraint project_activity_feed_kind_check
  check (
    kind = any (
      array[
        'project_saved'::text,
        'vendor_attached'::text,
        'vendor_invited'::text,
        'vendor_invite_declined'::text,
        'vendor_invite_cancelled'::text,
        'bid_received'::text,
        'bid_withdrawn'::text,
        'bid_declined'::text,
        'vendor_shortlisted'::text,
        'vendor_hired'::text,
        'priority_marked'::text,
        'project_needs_attention'::text,
        'compare_started'::text,
        'compare_updated'::text,
        'deal_room_opened'::text,
        'milestone_requested'::text,
        'milestone_approved'::text,
        'closeout_ready'::text,
        'review_requested'::text,
        'project_started'::text,
        'completion_requested'::text,
        'completion_request_withdrawn'::text,
        'completion_changes_requested'::text,
        'project_completed'::text,
        'project_reopened'::text,
        'workspace_sync'::text,
        'approval_requested'::text,
        'dispute_resolved'::text
      ]
    )
  );


-- ============================================================================
-- 9. POST-MIGRATION ASSERTIONS
-- These are deliberately inside the same transaction.
-- ============================================================================

do $$
begin
  if exists (
    select 1
    from public.project_vendor_links l
    join public.projects p on p.id = l.project_id
    left join public.vendors v on v.id = l.vendor_id
    where l.church_id is distinct from p.church_id
       or (
         l.vendor_id is not null
         and (
           v.id is null
           or v.user_id is distinct from l.vendor_user_id
         )
       )
  ) then
    raise exception
      'Migration 001 verification failed: project_vendor_links integrity check failed';
  end if;

  if exists (
    select 1
    from public.vendor_invites i
    join public.projects p on p.id = i.project_id
    join public.vendors v on v.id = i.vendor_id
    where i.church_id is distinct from p.church_id
       or v.user_id is distinct from i.vendor_user_id
  ) then
    raise exception
      'Migration 001 verification failed: vendor_invites integrity check failed';
  end if;

  if exists (
    select 1
    from public.match_snapshots s
    join public.projects p on p.id = s.project_id
    join public.vendors v on v.id = s.vendor_id
    where s.church_id is distinct from p.church_id
       or (
         s.vendor_user_id is not null
         and v.user_id is distinct from s.vendor_user_id
       )
  ) then
    raise exception
      'Migration 001 verification failed: match_snapshots integrity check failed';
  end if;
end
$$;

commit;

-- ============================================================================
-- END MIGRATION 001
-- ============================================================================
