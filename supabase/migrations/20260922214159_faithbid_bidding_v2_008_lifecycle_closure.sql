-- ============================================================================
-- FaithBid Bidding v2
-- Migration 008: Frontend-Aligned Lifecycle Closure
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- INPUTS
--   - Reconciled bidding backend 001–007
--   - Claude frontend UX architecture report dated 2026-09-22
--
-- PURPOSE
--   Close the remaining pre-frontend lifecycle/API gaps:
--     1. vendor declines invitation
--     2. church cancels invitation
--     3. church reads a canonical project invitation list
--     4. vendor opens a project conversation before submitting a proposal
--     5. project cancellation atomically resolves marketplace relationships
--
-- IMPORTANT
--   This file has NOT been applied.
--   It does not modify App.jsx.
--   It does not enable marketplace_public or bidding_enabled.
--   It does not activate Stripe/payments.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';


-- ============================================================================
-- 1. INVITATION + PROJECT CANCELLATION AUDIT FIELDS
-- ============================================================================

alter table public.vendor_invites
  add column cancelled_at timestamptz,
  add column cancelled_by uuid
    references auth.users(id) on delete set null,
  add column cancel_reason text not null default '';

alter table public.vendor_invites
  add constraint vendor_invites_cancel_reason_check
  check (char_length(cancel_reason) <= 500);

alter table public.vendor_invites
  drop constraint vendor_invites_status_check;

alter table public.vendor_invites
  add constraint vendor_invites_status_check
  check (
    status = any (
      array[
        'invited'::text,
        'bid_received'::text,
        'declined'::text,
        'no_response'::text,
        'cancelled'::text
      ]
    )
  );

alter table public.projects
  add column cancelled_at timestamptz,
  add column cancelled_by uuid
    references auth.users(id) on delete set null,
  add column cancellation_reason text not null default '';

alter table public.projects
  add constraint projects_cancellation_reason_check
  check (char_length(cancellation_reason) <= 500);


-- ============================================================================
-- 2. PROJECT ACTIVITY VOCABULARY
-- 001 already adds invite-decline/invite-cancel events. 008 adds the project
-- cancellation event itself.
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
        'project_cancelled'::text,
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
-- 3. CANCELLED INVITATIONS / ARCHIVED LINKS MUST NOT KEEP PRIVATE PROJECT
-- VISIBILITY ALIVE.
--
-- Preserve the existing public/admin/owner shape; tighten only relationship
-- visibility so a cancelled invitation is actually revocable.
-- ============================================================================

drop policy if exists kb_projects_select_authenticated
  on public.projects;

create policy kb_projects_select_authenticated
on public.projects
for select
to authenticated
using (
  public.kb_is_platform_admin()
  or hired_vendor_id = (select auth.uid())

  -- Church ownership must be unconditional. Marketplace privacy governs
  -- public/vendor discovery, not whether a church may read its own project.
  or church_id = (select auth.uid())

  -- Public marketplace discovery.
  or (
    public.kb_marketplace_public()
    and status = 'open'
  )

  -- Private/vendor relationship visibility. Terminal cancellation/archive
  -- states do not keep a private project visible.
  or (
    status = 'open'
    and (
      exists (
        select 1
        from public.vendor_invites vi
        where vi.project_id = projects.id
          and vi.vendor_user_id = (select auth.uid())
          and vi.status in (
            'invited',
            'no_response',
            'bid_received',
            'declined'
          )
      )
      or exists (
        select 1
        from public.project_vendor_links pvl
        where pvl.project_id = projects.id
          and pvl.vendor_user_id = (select auth.uid())
          and pvl.stage in (
            'watching',
            'invited',
            'bid_received',
            'shortlisted',
            'hired',
            'declined'
          )
      )
    )
  )
);


-- ============================================================================
-- 4. INVITATION LIFECYCLE MUTATION IS COMMAND-OWNED
--
-- Legacy frontend code still needs direct INSERT during the compatibility
-- window, but no current App.jsx path legitimately needs direct UPDATE.
-- 005/008 SECURITY DEFINER commands own response-state mutation.
-- ============================================================================

revoke update on table public.vendor_invites
  from authenticated;


-- ============================================================================
-- 5. INVITATION LIFECYCLE NOTIFICATION HELPER
-- Material terminal lifecycle events are durable and deduped.
-- ============================================================================

create or replace function private.faithbid_bidding_notify_invite_lifecycle_v1(
  p_invite_id uuid,
  p_event text,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event text := lower(btrim(coalesce(p_event, '')));
  v_invite public.vendor_invites%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_recipient uuid;
  v_type text;
  v_title text;
  v_body text;
  v_inserted integer := 0;
begin
  if p_invite_id is null or p_actor is null then
    raise exception 'invite and actor are required'
      using errcode = '22023';
  end if;

  if v_event not in (
    'bid_invitation_declined',
    'bid_invitation_cancelled'
  ) then
    raise exception 'unsupported invitation lifecycle event'
      using errcode = '22023';
  end if;

  select *
    into v_invite
  from public.vendor_invites
  where id = p_invite_id;

  if not found then
    raise exception 'invitation not found'
      using errcode = 'P0002';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_invite.project_id;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  select *
    into v_vendor
  from public.vendors
  where id = v_invite.vendor_id;

  if v_event = 'bid_invitation_declined' then
    if v_invite.vendor_user_id is distinct from p_actor
       or v_invite.status <> 'declined' then
      raise exception 'invitation decline state is not valid'
        using errcode = '42501';
    end if;

    v_recipient := v_project.church_id;
    v_type := 'bid_invitation_declined';
    v_title := 'Invitation declined';
    v_body :=
      coalesce(nullif(btrim(v_vendor.name), ''), 'A vendor')
      || ' declined the invitation to "'
      || coalesce(nullif(btrim(v_project.title), ''), 'your project')
      || '".';

  else
    if v_project.church_id is distinct from p_actor
       or v_invite.status <> 'cancelled' then
      raise exception 'invitation cancellation state is not valid'
        using errcode = '42501';
    end if;

    v_recipient := v_invite.vendor_user_id;
    v_type := 'bid_invitation_cancelled';
    v_title := 'Invitation closed';
    v_body :=
      'The invitation to "'
      || coalesce(nullif(btrim(v_project.title), ''), 'this project')
      || '" was closed by the church.';
  end if;

  if v_recipient is null or v_recipient = p_actor then
    return jsonb_build_object(
      'status_code', 'no_distinct_recipient',
      'inserted_count', 0
    );
  end if;

  insert into public.notifications (
    user_id,
    type,
    text,
    title,
    body,
    link,
    read,
    created_at,
    meta
  )
  values (
    v_recipient,
    v_type,
    left(v_body, 500),
    v_title,
    left(v_body, 500),
    'projects/' || v_project.id::text,
    false,
    now(),
    jsonb_build_object(
      'source', 'faithbid_bidding_invite_lifecycle_v1',
      'source_event', v_event,
      'context_id', v_invite.id::text,
      'project_id', v_project.id::text,
      'invite_id', v_invite.id::text,
      'actor_id', p_actor::text
    )
  )
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'status_code',
      case when v_inserted > 0 then 'created' else 'already_recorded' end,
    'event', v_event,
    'inserted_count', v_inserted
  );
end;
$function$;

revoke all on function private.faithbid_bidding_notify_invite_lifecycle_v1(
  uuid,text,uuid
) from public, anon, authenticated;


-- ============================================================================
-- 6. VENDOR DECLINES INVITATION
--
-- This works for both:
--   canonical vendor_invites
--   legacy link-only project_vendor_links(stage='invited')
--
-- no_response remains a soft operational label and can still be explicitly
-- declined by the vendor.
-- ============================================================================

create or replace function public.faithbid_bidding_decline_invite_v1(
  p_project_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_invite public.vendor_invites%rowtype;
  v_link public.project_vendor_links%rowtype;

  v_reason text := btrim(coalesce(p_reason, ''));
  v_invited_at timestamptz;
  v_no_response_after timestamptz;
  v_response_class text;

  v_has_invite boolean := false;
  v_has_link boolean := false;

  v_relationship_id uuid;
  v_activity_id uuid;
  v_notification jsonb := '{}'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'project id is required'
      using errcode = '22023';
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'decline reason is too long'
      using errcode = '22023';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is no longer open'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_actor;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.bids b
    where b.project_id = v_project.id
      and b.vendor_id = v_actor
  ) then
    raise exception 'invitation already progressed to a proposal'
      using errcode = 'P0001';
  end if;

  select *
    into v_invite
  from public.vendor_invites
  where project_id = v_project.id
    and vendor_id = v_vendor.id
  for update;

  v_has_invite := found;

  select *
    into v_link
  from public.project_vendor_links
  where project_id = v_project.id
    and vendor_user_id = v_actor
  for update;

  v_has_link := found;

  if v_has_invite
     and v_invite.status in ('bid_received','cancelled') then
    raise exception 'invitation cannot be declined from its current state'
      using errcode = 'P0001';
  end if;

  if not v_has_invite
     and (
       not v_has_link
       or v_link.stage not in ('invited','declined')
     ) then
    raise exception 'active invitation not found'
      using errcode = 'P0002';
  end if;

  v_invited_at := coalesce(
    case when v_has_invite then v_invite.invited_at end,
    case when v_has_link then v_link.invited_at end,
    now()
  );

  v_no_response_after := coalesce(
    case when v_has_invite then v_invite.no_response_after_at end,
    public.kb_add_business_days(v_invited_at, 3)
  );

  v_response_class :=
    case
      when now() <= v_no_response_after then 'fast_decline'
      else 'normal_decline'
    end;

  if not v_has_invite then
    insert into public.vendor_invites (
      project_id,
      church_id,
      vendor_id,
      vendor_user_id,
      match_snapshot_id,
      status,
      invited_at,
      no_response_after_at,
      responded_at,
      declined_at,
      decline_reason,
      response_class,
      created_by
    )
    values (
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_actor,
      null,
      'declined',
      v_invited_at,
      v_no_response_after,
      now(),
      now(),
      v_reason,
      v_response_class,
      v_project.church_id
    )
    returning * into v_invite;

  elsif v_invite.status <> 'declined' then
    update public.vendor_invites
       set status = 'declined',
           responded_at = coalesce(responded_at, now()),
           declined_at = coalesce(declined_at, now()),
           decline_reason = v_reason,
           response_class = v_response_class
     where id = v_invite.id
     returning * into v_invite;
  end if;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_actor,
      'declined',
      null
    );

  -- No active proposal exists, so the invitation conversation can leave the
  -- active Inbox without losing history.
  update public.conversations
     set archived = true
   where project_id = v_project.id
     and church_id = v_project.church_id
     and vendor_id = v_actor;

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'vendor_invite_declined'
    and a.meta ->> 'invite_id' = v_invite.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'vendor_invite_declined',
      'Invitation declined',
      coalesce(nullif(btrim(v_vendor.name), ''), 'Vendor')
        || ' declined the invitation.',
      jsonb_build_object(
        'source', 'faithbid_bidding_decline_invite_v1',
        'invite_id', v_invite.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_actor::text,
        'response_class', v_invite.response_class
      ),
      v_actor
    )
    into v_activity_id;
  end if;

  v_notification :=
    private.faithbid_bidding_notify_invite_lifecycle_v1(
      v_invite.id,
      'bid_invitation_declined',
      v_actor
    );

  return jsonb_build_object(
    'ok', true,
    'status_code', 'INVITATION_DECLINED',
    'project_id', v_project.id,
    'invite_id', v_invite.id,
    'relationship_id', v_relationship_id,
    'status', v_invite.status,
    'response_class', v_invite.response_class,
    'activity_id', v_activity_id,
    'notification', v_notification
  );
end;
$function$;

revoke all on function public.faithbid_bidding_decline_invite_v1(uuid,text)
  from public, anon;

grant execute on function public.faithbid_bidding_decline_invite_v1(uuid,text)
  to authenticated;


-- ============================================================================
-- 7. CHURCH CANCELS INVITATION
--
-- "Cancel invitation" closes the church-issued invitation. It does not mean
-- the church declined a submitted proposal. Once a proposal exists, use the
-- proposal lifecycle instead.
-- ============================================================================

create or replace function public.faithbid_bidding_cancel_invite_v1(
  p_project_id uuid,
  p_vendor_profile_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_invite public.vendor_invites%rowtype;
  v_link public.project_vendor_links%rowtype;

  v_reason text := btrim(coalesce(p_reason, ''));
  v_invited_at timestamptz;
  v_no_response_after timestamptz;

  v_has_invite boolean := false;
  v_has_link boolean := false;

  v_relationship_id uuid;
  v_activity_id uuid;
  v_notification jsonb := '{}'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null or p_vendor_profile_id is null then
    raise exception 'project and vendor are required'
      using errcode = '22023';
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'cancel reason is too long'
      using errcode = '22023';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from v_actor then
    raise exception 'only the posting church may cancel this invitation'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is no longer open'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where id = p_vendor_profile_id;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.bids b
    where b.project_id = v_project.id
      and b.vendor_id = v_vendor.user_id
  ) then
    raise exception 'vendor already submitted a proposal; use proposal actions instead'
      using errcode = 'P0001';
  end if;

  select *
    into v_invite
  from public.vendor_invites
  where project_id = v_project.id
    and vendor_id = v_vendor.id
  for update;

  v_has_invite := found;

  select *
    into v_link
  from public.project_vendor_links
  where project_id = v_project.id
    and vendor_user_id = v_vendor.user_id
  for update;

  v_has_link := found;

  if v_has_invite
     and v_invite.status in ('bid_received','declined') then
    raise exception 'invitation is already resolved by the vendor'
      using errcode = 'P0001';
  end if;

  if not v_has_invite
     and (
       not v_has_link
       or v_link.stage not in ('invited','archived')
     ) then
    raise exception 'invitation not found'
      using errcode = 'P0002';
  end if;

  v_invited_at := coalesce(
    case when v_has_invite then v_invite.invited_at end,
    case when v_has_link then v_link.invited_at end,
    now()
  );

  v_no_response_after := coalesce(
    case when v_has_invite then v_invite.no_response_after_at end,
    public.kb_add_business_days(v_invited_at, 3)
  );

  if not v_has_invite then
    insert into public.vendor_invites (
      project_id,
      church_id,
      vendor_id,
      vendor_user_id,
      match_snapshot_id,
      status,
      invited_at,
      no_response_after_at,
      cancelled_at,
      cancelled_by,
      cancel_reason,
      created_by
    )
    values (
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_vendor.user_id,
      null,
      'cancelled',
      v_invited_at,
      v_no_response_after,
      now(),
      v_actor,
      v_reason,
      v_project.church_id
    )
    returning * into v_invite;

  elsif v_invite.status <> 'cancelled' then
    update public.vendor_invites
       set status = 'cancelled',
           cancelled_at = coalesce(cancelled_at, now()),
           cancelled_by = coalesce(cancelled_by, v_actor),
           cancel_reason = v_reason
     where id = v_invite.id
     returning * into v_invite;
  end if;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_vendor.user_id,
      'archived',
      null
    );

  update public.conversations
     set archived = true
   where project_id = v_project.id
     and church_id = v_project.church_id
     and vendor_id = v_vendor.user_id;

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'vendor_invite_cancelled'
    and a.meta ->> 'invite_id' = v_invite.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'vendor_invite_cancelled',
      'Invitation closed',
      'The invitation to '
        || coalesce(nullif(btrim(v_vendor.name), ''), 'the vendor')
        || ' was closed.',
      jsonb_build_object(
        'source', 'faithbid_bidding_cancel_invite_v1',
        'invite_id', v_invite.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_vendor.user_id::text
      ),
      v_vendor.user_id
    )
    into v_activity_id;
  end if;

  v_notification :=
    private.faithbid_bidding_notify_invite_lifecycle_v1(
      v_invite.id,
      'bid_invitation_cancelled',
      v_actor
    );

  return jsonb_build_object(
    'ok', true,
    'status_code', 'INVITATION_CANCELLED',
    'project_id', v_project.id,
    'invite_id', v_invite.id,
    'relationship_id', v_relationship_id,
    'status', v_invite.status,
    'activity_id', v_activity_id,
    'notification', v_notification
  );
end;
$function$;

revoke all on function public.faithbid_bidding_cancel_invite_v1(
  uuid,uuid,text
) from public, anon;

grant execute on function public.faithbid_bidding_cancel_invite_v1(
  uuid,uuid,text
) to authenticated;


-- ============================================================================
-- 8. CHURCH-SIDE PROJECT INVITATION QUERY
--
-- Claude's Workspace design needs a real Invitations section. 003 provides the
-- vendor's invitation queue, but not the church's canonical list.
-- ============================================================================

create or replace function public.faithbid_bidding_get_project_invites_v1(
  p_project_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_is_admin boolean := false;
  v_items jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  v_is_admin := coalesce(public.kb_is_platform_admin(), false);

  if not v_is_admin and v_project.church_id is distinct from v_actor then
    raise exception 'not authorized for this project'
      using errcode = '42501';
  end if;

  with candidate_vendors as (
    select i.vendor_id
    from public.vendor_invites i
    where i.project_id = v_project.id

    union

    select l.vendor_id
    from public.project_vendor_links l
    where l.project_id = v_project.id
      and l.vendor_id is not null
      and l.stage = 'invited'
  ),
  resolved as (
    select
      cv.vendor_id,
      v.user_id as vendor_user_id,
      v.name as vendor_name,
      v.category,
      v.rating,
      v.reviews_count,
      v.verification_status,
      v.verified as faith_verified,
      v.suspended,

      i.id as invite_id,
      i.status as invite_status,
      i.invited_at as invite_invited_at,
      i.no_response_after_at,
      i.responded_at,
      i.declined_at,
      i.decline_reason,
      i.response_class,
      i.cancelled_at,
      i.cancelled_by,
      i.cancel_reason,
      i.match_snapshot_id,

      l.id as project_vendor_link_id,
      l.stage as link_stage,
      l.source as link_source,
      l.invited_at as link_invited_at,

      b.id as bid_id,
      b.status as bid_status,

      c.id as conversation_id
    from candidate_vendors cv
    join public.vendors v
      on v.id = cv.vendor_id

    left join public.vendor_invites i
      on i.project_id = v_project.id
     and i.vendor_id = cv.vendor_id

    left join public.project_vendor_links l
      on l.project_id = v_project.id
     and l.vendor_user_id = v.user_id

    left join public.bids b
      on b.project_id = v_project.id
     and b.vendor_id = v.user_id

    left join public.conversations c
      on c.project_id = v_project.id
     and c.church_id = v_project.church_id
     and c.vendor_id = v.user_id
  ),
  shaped as (
    select
      r.*,
      coalesce(
        r.no_response_after_at,
        public.kb_add_business_days(r.link_invited_at, 3)
      ) as effective_no_response_after_at,

      case
        when r.bid_id is not null then 'bid_received'
        when r.invite_status is not null
             and r.invite_status <> 'invited'
          then r.invite_status
        when coalesce(
               r.no_response_after_at,
               public.kb_add_business_days(r.link_invited_at, 3)
             ) <= now()
          then 'no_response'
        else 'invited'
      end as effective_status,

      case
        when r.invite_id is not null
             and r.project_vendor_link_id is not null
          then 'both'
        when r.invite_id is not null
          then 'vendor_invite'
        else 'project_vendor_link'
      end as source_kind
    from resolved r
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'invite_id', s.invite_id,
        'project_vendor_link_id', s.project_vendor_link_id,
        'source_kind', s.source_kind,
        'stored_invite_status', s.invite_status,
        'relationship_stage', s.link_stage,
        'relationship_source', s.link_source,
        'effective_status', s.effective_status,
        'invited_at', coalesce(s.invite_invited_at, s.link_invited_at),
        'no_response_after_at', s.effective_no_response_after_at,
        'responded_at', s.responded_at,
        'declined_at', s.declined_at,
        'decline_reason', s.decline_reason,
        'response_class', s.response_class,
        'cancelled_at', s.cancelled_at,
        'cancelled_by', s.cancelled_by,
        'cancel_reason', s.cancel_reason,
        'match_snapshot_id', s.match_snapshot_id,
        'bid_id', s.bid_id,
        'bid_status', s.bid_status,
        'conversation_id', s.conversation_id,
        'can_cancel',
          lower(btrim(coalesce(v_project.status, ''))) = 'open'
          and s.bid_id is null
          and (
            s.invite_status in ('invited','no_response')
            or (
              s.invite_id is null
              and s.link_stage = 'invited'
            )
          ),
        'vendor', jsonb_build_object(
          'vendor_profile_id', s.vendor_id,
          'vendor_user_id', s.vendor_user_id,
          'name', s.vendor_name,
          'category', s.category,
          'rating', s.rating,
          'reviews_count', coalesce(s.reviews_count, 0),
          'marketplace_approved',
            (
              lower(btrim(coalesce(s.verification_status, ''))) = 'approved'
              or (
                s.verification_status is null
                and coalesce(s.faith_verified, false)
              )
            ),
          'faith_verified', coalesce(s.faith_verified, false),
          'suspended', coalesce(s.suspended, false)
        )
      )
      order by coalesce(s.invite_invited_at, s.link_invited_at) desc nulls last,
               s.vendor_id
    ),
    '[]'::jsonb
  )
  into v_items
  from shaped s;

  return jsonb_build_object(
    'project', jsonb_build_object(
      'id', v_project.id,
      'title', v_project.title,
      'status', v_project.status
    ),
    'count', jsonb_array_length(v_items),
    'invitations', v_items
  );
end;
$function$;

revoke all on function public.faithbid_bidding_get_project_invites_v1(uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_get_project_invites_v1(uuid)
  to authenticated;


-- ============================================================================
-- 9. PRE-PROPOSAL PROJECT CONVERSATION
--
-- Claude's vendor Workspace includes "Ask a question" before submission.
-- Live conversation RLS cannot create that thread for a marketplace-discovered
-- vendor unless a relationship already exists. This command creates the
-- minimum watching relationship + one canonical conversation when authorized.
-- ============================================================================

create or replace function public.faithbid_bidding_open_project_conversation_v1(
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_profile public.profiles%rowtype;
  v_vendor public.vendors%rowtype;
  v_link public.project_vendor_links%rowtype;
  v_church_profile public.profiles%rowtype;

  v_marketplace_public boolean := false;
  v_relationship_allowed boolean := false;

  v_relationship_id uuid;
  v_conversation_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not open'
      using errcode = 'P0001';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = v_actor;

  if not found
     or lower(btrim(coalesce(v_profile.role, ''))) <> 'vendor'
     or lower(btrim(coalesce(v_profile.account_status, 'active'))) <> 'active'
     or lower(btrim(coalesce(v_profile.access_status, 'active'))) <> 'active' then
    raise exception 'active vendor account required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = v_actor
      and u.email_confirmed_at is not null
  ) then
    raise exception 'confirm your email before contacting a church'
      using errcode = '42501';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_actor;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if coalesce(v_vendor.suspended, false)
     or not (
       lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
       or (
         v_vendor.verification_status is null
         and coalesce(v_vendor.verified, false)
       )
     ) then
    raise exception 'Marketplace Approved vendor account required'
      using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.platform_settings s
    where s.key = 'marketplace_public'
      and lower(btrim(coalesce(s.value, ''))) in ('true','1','yes','on')
  )
  into v_marketplace_public;

  select *
    into v_link
  from public.project_vendor_links
  where project_id = v_project.id
    and vendor_user_id = v_actor
  for update;

  v_relationship_allowed :=
       v_marketplace_public
    or exists (
      select 1
      from public.bids b
      where b.project_id = v_project.id
        and b.vendor_id = v_actor
    )
    or (
      found
      and v_link.stage in (
        'watching',
        'invited',
        'bid_received',
        'shortlisted',
        'hired',
        'declined'
      )
    )
    or exists (
      select 1
      from public.vendor_invites i
      where i.project_id = v_project.id
        and i.vendor_user_id = v_actor
        and i.status in (
          'invited',
          'no_response',
          'bid_received',
          'declined'
        )
    );

  if not v_relationship_allowed then
    raise exception 'vendor does not have access to start a project conversation'
      using errcode = '42501';
  end if;

  if not found or v_link.stage = 'archived' then
    v_relationship_id :=
      private.faithbid_bidding_sync_project_vendor_link_v1(
        v_project.id,
        v_project.church_id,
        v_vendor.id,
        v_actor,
        'watching',
        'marketplace'
      );
  else
    v_relationship_id := v_link.id;
  end if;

  select c.id
    into v_conversation_id
  from public.conversations c
  where c.project_id = v_project.id
    and c.church_id = v_project.church_id
    and c.vendor_id = v_actor
  order by c.id
  limit 1
  for update;

  if v_conversation_id is null then
    select *
      into v_church_profile
    from public.profiles
    where id = v_project.church_id;

    insert into public.conversations (
      project_id,
      church_id,
      vendor_id,
      church_name,
      vendor_name,
      vendor_emoji,
      status,
      project_title,
      budget,
      category,
      archived
    )
    values (
      v_project.id,
      v_project.church_id,
      v_actor,
      nullif(btrim(coalesce(v_church_profile.org_name, '')), ''),
      v_vendor.name,
      coalesce(v_vendor.emoji, '🏢'),
      'open',
      coalesce(v_project.title, ''),
      coalesce(v_project.budget, ''),
      coalesce(v_project.category, ''),
      false
    )
    returning id into v_conversation_id;
  else
    update public.conversations
       set archived = false,
           status = 'open'
     where id = v_conversation_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROJECT_CONVERSATION_READY',
    'project_id', v_project.id,
    'vendor_profile_id', v_vendor.id,
    'vendor_user_id', v_actor,
    'relationship_id', v_relationship_id,
    'conversation_id', v_conversation_id
  );
end;
$function$;

revoke all on function public.faithbid_bidding_open_project_conversation_v1(uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_open_project_conversation_v1(uuid)
  to authenticated;


-- ============================================================================
-- 10. PROJECT CANCELLATION METADATA
-- Keeps the old hidden direct `projects.update({status:'cancelled'})` path
-- compatible while making cancellation auditable.
-- ============================================================================

create or replace function private.faithbid_bidding_project_cancel_metadata_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status = 'cancelled'
     and old.status is distinct from 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
    new.cancelled_by := coalesce(
      new.cancelled_by,
      auth.uid(),
      new.church_id
    );
    new.cancellation_reason := coalesce(new.cancellation_reason, '');
  end if;

  return new;
end;
$function$;

revoke all on function private.faithbid_bidding_project_cancel_metadata_v1()
  from public, anon, authenticated;

drop trigger if exists faithbid_project_cancel_metadata_v1
  on public.projects;

create trigger faithbid_project_cancel_metadata_v1
before update of status on public.projects
for each row
execute function private.faithbid_bidding_project_cancel_metadata_v1();


-- ============================================================================
-- 11. ATOMIC PROJECT-CANCELLATION SIDE EFFECTS
--
-- Runs for BOTH:
--   - future faithbid_bidding_cancel_project_v1
--   - hidden old App.jsx direct update to status='cancelled'
--
-- The old frontend's later call to kb_create_trusted_notification
-- ('project_cancelled', project_id) remains harmless because notification
-- dedupe uses (recipient, source_event, context_id).
-- ============================================================================

create or replace function private.faithbid_bidding_project_cancel_side_effects_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := coalesce(
    auth.uid(),
    new.cancelled_by,
    new.church_id
  );
  v_project_title text :=
    coalesce(nullif(btrim(new.title), ''), 'This project');
  v_body text;
begin
  if new.status <> 'cancelled'
     or old.status is not distinct from 'cancelled' then
    return new;
  end if;

  v_body :=
    '"' || v_project_title
    || '" was cancelled by the church. Any open invitation or proposal is now closed.';

  -- Notify each materially involved vendor exactly once. This fixes the live
  -- helper's pending-only gap and also includes invite-only / conversation-only
  -- vendors who need to know the project closed.
  insert into public.notifications (
    user_id,
    type,
    text,
    title,
    body,
    link,
    read,
    created_at,
    meta
  )
  select distinct
    r.vendor_user_id,
    'project_cancelled',
    left(v_body, 500),
    'Project cancelled',
    left(v_body, 500),
    'projects/' || new.id::text,
    false,
    now(),
    jsonb_build_object(
      'source', 'faithbid_bidding_project_cancel_side_effects_v1',
      'source_event', 'project_cancelled',
      'context_id', new.id::text,
      'project_id', new.id::text,
      'actor_id', v_actor::text
    )
  from (
    select b.vendor_id as vendor_user_id
    from public.bids b
    where b.project_id = new.id
      and b.status in ('pending','under_review')

    union

    select i.vendor_user_id
    from public.vendor_invites i
    where i.project_id = new.id
      and i.vendor_user_id is not null
      and i.status in ('invited','no_response')

    union

    select l.vendor_user_id
    from public.project_vendor_links l
    where l.project_id = new.id
      and l.stage in (
        'watching',
        'invited',
        'bid_received',
        'shortlisted'
      )

    union

    select c.vendor_id
    from public.conversations c
    where c.project_id = new.id
      and not coalesce(c.archived, false)
  ) r
  where r.vendor_user_id is not null
    and r.vendor_user_id <> new.church_id
  on conflict do nothing;

  -- Preserve legacy link-only invitations as canonical cancelled history before
  -- archiving their relationship.
  insert into public.vendor_invites (
    project_id,
    church_id,
    vendor_id,
    vendor_user_id,
    match_snapshot_id,
    status,
    invited_at,
    no_response_after_at,
    cancelled_at,
    cancelled_by,
    cancel_reason,
    created_by
  )
  select
    l.project_id,
    l.church_id,
    l.vendor_id,
    l.vendor_user_id,
    null,
    'cancelled',
    coalesce(l.invited_at, now()),
    public.kb_add_business_days(coalesce(l.invited_at, now()), 3),
    coalesce(new.cancelled_at, now()),
    v_actor,
    coalesce(new.cancellation_reason, ''),
    l.church_id
  from public.project_vendor_links l
  where l.project_id = new.id
    and l.stage = 'invited'
    and l.vendor_id is not null
    and not exists (
      select 1
      from public.vendor_invites i
      where i.project_id = l.project_id
        and i.vendor_id = l.vendor_id
    )
  on conflict (project_id, vendor_id) do nothing;

  update public.vendor_invites
     set status = 'cancelled',
         cancelled_at = coalesce(cancelled_at, new.cancelled_at, now()),
         cancelled_by = coalesce(cancelled_by, v_actor),
         cancel_reason = case
           when char_length(btrim(coalesce(cancel_reason, ''))) > 0
             then cancel_reason
           else coalesce(new.cancellation_reason, '')
         end
   where project_id = new.id
     and status in ('invited','no_response');

  update public.project_vendor_links
     set stage = 'archived',
         last_activity_at = now()
   where project_id = new.id
     and stage in (
       'watching',
       'invited',
       'bid_received',
       'shortlisted'
     );

  -- Preserve message history while removing the project from the active Inbox.
  update public.conversations
     set archived = true
   where project_id = new.id;

  if not exists (
    select 1
    from public.project_activity_feed a
    where a.project_id = new.id
      and a.kind = 'project_cancelled'
  ) then
    insert into public.project_activity_feed (
      project_id,
      church_id,
      actor_user_id,
      vendor_user_id,
      kind,
      title,
      body,
      meta
    )
    values (
      new.id,
      new.church_id,
      v_actor,
      null,
      'project_cancelled',
      'Project cancelled',
      v_body,
      jsonb_build_object(
        'source', 'faithbid_bidding_project_cancel_side_effects_v1',
        'from_status', old.status,
        'to_status', new.status,
        'cancelled_at', new.cancelled_at,
        'cancelled_by',
          case
            when new.cancelled_by is null then null
            else new.cancelled_by::text
          end
      )
    );
  end if;

  return new;
end;
$function$;

revoke all on function private.faithbid_bidding_project_cancel_side_effects_v1()
  from public, anon, authenticated;

drop trigger if exists faithbid_project_cancel_side_effects_v1
  on public.projects;

create trigger faithbid_project_cancel_side_effects_v1
after update of status on public.projects
for each row
execute function private.faithbid_bidding_project_cancel_side_effects_v1();


-- ============================================================================
-- 12. CANONICAL PROJECT CANCELLATION COMMAND
-- ============================================================================

create or replace function public.faithbid_bidding_cancel_project_v1(
  p_project_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'project id is required'
      using errcode = '22023';
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'cancellation reason is too long'
      using errcode = '22023';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from v_actor then
    raise exception 'only the posting church may cancel this project'
      using errcode = '42501';
  end if;

  if v_project.status = 'cancelled' then
    return jsonb_build_object(
      'ok', true,
      'status_code', 'PROJECT_ALREADY_CANCELLED',
      'project_id', v_project.id,
      'status', v_project.status,
      'cancelled_at', v_project.cancelled_at,
      'cancelled_by', v_project.cancelled_by
    );
  end if;

  if v_project.status <> 'open' then
    raise exception 'only an open bidding project may be cancelled here'
      using errcode = 'P0001';
  end if;

  update public.projects
     set status = 'cancelled',
         cancellation_reason = v_reason
   where id = v_project.id
   returning * into v_project;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROJECT_CANCELLED',
    'project_id', v_project.id,
    'status', v_project.status,
    'cancelled_at', v_project.cancelled_at,
    'cancelled_by', v_project.cancelled_by,
    'cancellation_reason', v_project.cancellation_reason,
    'active_proposals_closed', (
      select count(*)
      from public.bids b
      where b.project_id = v_project.id
        and b.status in ('pending','under_review')
    ),
    'invitations_cancelled', (
      select count(*)
      from public.vendor_invites i
      where i.project_id = v_project.id
        and i.status = 'cancelled'
    ),
    'relationships_archived', (
      select count(*)
      from public.project_vendor_links l
      where l.project_id = v_project.id
        and l.stage = 'archived'
    )
  );
end;
$function$;

revoke all on function public.faithbid_bidding_cancel_project_v1(uuid,text)
  from public, anon;

grant execute on function public.faithbid_bidding_cancel_project_v1(uuid,text)
  to authenticated;


commit;

-- ============================================================================
-- END MIGRATION 008
-- ============================================================================
