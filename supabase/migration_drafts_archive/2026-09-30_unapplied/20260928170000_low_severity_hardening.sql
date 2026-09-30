-- R-36: remaining low-severity security items from the platform audit.
-- Deliberately NOT changed: execute on public.kb_has_private_marketplace_access(uuid)
-- (row-level-security policies depend on it) and public.kb_profiles_public(uuid[])
-- (ids are unguessable and it returns public display fields only).

-- 1) vendor_invites: response / cancel fields can only change through the bidding
--    RPCs (security definer) or an admin. A church can no longer forge a decline.
create or replace function private.kb_guard_vendor_invite_identity_v1()
returns trigger
language plpgsql
set search_path to ''
as $$
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

  if current_user in ('authenticated', 'anon')
     and (new.status is distinct from old.status
       or new.invited_at is distinct from old.invited_at
       or new.responded_at is distinct from old.responded_at
       or new.declined_at is distinct from old.declined_at
       or new.decline_reason is distinct from old.decline_reason
       or new.bid_id is distinct from old.bid_id
       or new.no_response_after_at is distinct from old.no_response_after_at
       or new.response_class is distinct from old.response_class
       or new.cancelled_at is distinct from old.cancelled_at
       or new.cancelled_by is distinct from old.cancelled_by
       or new.cancel_reason is distinct from old.cancel_reason) then
    raise exception
      'Vendor invitation response fields change only through the bidding workflow'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- 2) projects: system-maintained counters and liquidity fields cannot be written
--    directly by a project owner. Nested trigger writes (depth > 1) and
--    security-definer functions (not running as authenticated) are unaffected.
create or replace function private.kb_guard_project_system_columns_v1()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if current_user not in ('authenticated', 'anon')
     or pg_trigger_depth() > 1
     or coalesce(public.kb_is_platform_admin(), false) then
    return new;
  end if;

  if new.bids_count is distinct from old.bids_count
     or new.actionable_bids_count is distinct from old.actionable_bids_count
     or new.qualified_comparable_proposal_count is distinct from old.qualified_comparable_proposal_count
     or new.liquidity_status is distinct from old.liquidity_status
     or new.liquidity_evaluated_at is distinct from old.liquidity_evaluated_at
     or new.thin_coverage_alerted_at is distinct from old.thin_coverage_alerted_at
     or new.thin_coverage_resolved_at is distinct from old.thin_coverage_resolved_at
     or new.proposal_response_window_ends_at is distinct from old.proposal_response_window_ends_at
     or new.source is distinct from old.source
     or new.source_group_name is distinct from old.source_group_name then
    raise exception 'Project system fields cannot be edited directly'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists kb_guard_project_system_columns_v1 on public.projects;
create trigger kb_guard_project_system_columns_v1
  before update of bids_count, actionable_bids_count, qualified_comparable_proposal_count,
                   liquidity_status, liquidity_evaluated_at, thin_coverage_alerted_at,
                   thin_coverage_resolved_at, proposal_response_window_ends_at, source, source_group_name
  on public.projects
  for each row execute function private.kb_guard_project_system_columns_v1();

-- 3) match_events: an event must point at a real project owned by the church it names.
drop policy if exists match_events_insert_own_rows on public.match_events;
create policy match_events_insert_own_rows on public.match_events
  for insert to authenticated
  with check (
    (actor_user_id = ((select auth.uid()))::text or church_id = ((select auth.uid()))::text)
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id::text = match_events.project_id
          and (match_events.church_id is null or p.church_id::text = match_events.church_id)
      )
    )
  );

-- 4) vendor_availability: signed-in users only (no anonymous reads).
drop policy if exists kb_vendor_availability_public_select on public.vendor_availability;
create policy kb_vendor_availability_public_select on public.vendor_availability
  for select to authenticated
  using (true);
